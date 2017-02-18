import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di';
import { 
  RenderableInjector, 
  Renderable, 
  RemoveChildArgs,
  AddChildArgs,
  ConfiguredRenderable,
  BaseModificationArgs
} from '../dom';
import { BeforeDestroyEvent, BusEvent, Subject, Observable } from '../events';
import { ConfigurationRef, ContainerRef, RenderableArg, XYDirection } from '../common';
import { XYItemContainer, XYItemContainerConfig } from '../XYItemContainer';
import { StackHeader, StackHeaderConfigArgs } from './StackHeader';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { TabDragEvent } from './TabDragEvent';
import { StackItemCloseEvent } from './StackItemCloseEvent';
import { StackItemContainer, StackItemContainerConfig } from './StackItemContainer';
import { RootInjector } from '../RootInjector';
import { StackTab } from './StackTab';
import { clamp, get, isNumber } from '../utils';
import { StackRegion } from './common';
import { Row } from '../Row';
import { Column } from '../Column';

export interface StackItemRemovalOptions {
 destroy?: boolean;
}

export interface StackConfig {
  children: StackItemContainerConfig[];
  startIndex?: number;
  direction?: XYDirection;
  reverse?: boolean;
  header?: StackHeaderConfigArgs;
}

export interface StackAddChildOptions {
  title?: string;
  index?: number;
}

export interface StackEntry {
  item: StackItemContainer;
  tab: StackTab;
}

export class Stack extends Renderable {
  private _direction: XYDirection;
  private _header: StackHeader;
  private _activeIndex: number = 0;
  protected _contentItems: StackItemContainer[] = [];
  
  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackConfig|null,
    @Inject(ContainerRef) protected _container: Renderable
  ) {
    super(_injector);
    
    this._header = Injector.fromInjectable(
      StackHeader, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: this._config ? this._config.header : null },
        StackHeader 
      ], 
      this._injector
    )
      .get(StackHeader);

    this._header.subscribe(TabCloseEvent, this._onTabClose.bind(this));
    this._header.subscribe(TabSelectionEvent, this._onTabSelect.bind(this));
    this._header.subscribe(TabDragEvent, this._onTabDrag.bind(this));
    
    if (this._config) {
      this._config.children.forEach(child => {
        this.addChild(this.createChild(child), { render: false, resize: false });
      });
      
      this._setActiveIndex(this._config.startIndex);
    }
  }

  get direction(): XYDirection {
    return this._config && this._config.direction != null ? this._config.direction : XYDirection.X;
  }

  get isHorizontal(): boolean {
    return this.direction === XYDirection.X;
  }

  get isReversed(): boolean {
    return Boolean(this._config && this._config.reverse === true);
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  get header(): StackHeader {
    return this._header;
  }

  render(): VNode {
    return h(`div.ug-layout__stack`, {
      class: {
        'ug-layout__stack-y': !this.isHorizontal,
        'ug-layout__stack-reverse': this.isReversed
      }
    }, [
      this._header.render(),
      ...this._contentItems.map(item => item.render())  
    ]);
  }

  createChild(config: StackItemContainerConfig): StackItemContainer {
    return Injector.fromInjectable(
      StackItemContainer, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        StackItemContainer
      ],
      this._injector
    )
      .get(StackItemContainer) as StackItemContainer
  }

  addChild(item: Renderable, options: AddChildArgs = {}): void {
    const { index } = options;
    let container: StackItemContainer;

    if (!(item instanceof StackItemContainer)) {
      container = this.createChild({ use: item });
    } else {
      container = item;
    }
    
    const tab = this._header.addTab({
      title: container.title,
      maxSize: get<number>(this._config, 'header.maxTabSize', 200),
    }, {
      index, 
      render: false,
      resize: false
    });
    
    super.addChild(item, options);
  }

  removeChild(item: StackItemContainer, options: RemoveChildArgs = {}): void {
    const { render = true } = options;
    const index = this._contentItems.indexOf(item);

    if (index === -1) {
      return;
    }

    const tab = this._header.getAtIndex(index);
    
    if (tab) {
      this._header.removeChild(tab, Object.assign({}, options, { render: false }));
    }
    
    super.removeChild(item, Object.assign({}, options, { render: false }));

    this._setActiveIndex(index);

    if (render) {
      this._renderer.render();
    }
  }

  setActiveIndex(index?: number, args: BaseModificationArgs = {}): void {
    const { render = true } = args;
    
    this._setActiveIndex(index);

    if (render) {
      this._renderer.render();
    }
  }

  removeAtIndex(index: number, options: RemoveChildArgs = {}): void {
    const item = this.getAtIndex(index); 
    
    if (item) {
      this.removeChild(item as StackItemContainer, options);
    }
  }

  destroy(): void {
    this._header.destroy();
    super.destroy();
  }

  getChildren(): Renderable[] {
    return [
      ...this._contentItems,
      this._header
    ];
  }
  
  getIndexOfTab(tab: StackTab): number {
    return this._header.getIndexOf(tab);
  }
  
  isActiveContainer(container: StackItemContainer): boolean {
    return this.getIndexOf(container) === this.activeIndex;
  } 
  
  isActiveTab(tab: StackTab): boolean {
    return this._header.getIndexOf(tab) === this.activeIndex;
  }
  
  getTabAtIndex(index: number): StackTab|null {
    return this._header.getAtIndex(index) as StackTab|null;
  }
  
  setActiveContainer(container: StackItemContainer): void {
    this.setActiveIndex(this.getIndexOf(container));
  }
  
  setActiveTab(tab: StackTab): void {
    this.setActiveIndex(this.getIndexOfTab(tab));
  }

  _handleItemDrop(region: StackRegion, item: Renderable): void {
    
    if (this._container instanceof XYItemContainer) {
      if (
        ((region === StackRegion.EAST || region === StackRegion.WEST) && this._container.isRow)
        || ((region === StackRegion.NORTH || region === StackRegion.SOUTH) && !this._container.isRow)
      ) {
        const containerIndex = this._container.container.getIndexOf(this._container);
        const index = region === StackRegion.NORTH || region === StackRegion.WEST 
          ? containerIndex
          : containerIndex + 1;
        
        this._container.addChild(item, { index, render: false, resize: false });
        this._container.ratio = <number>this._container.ratio * 0.5;
        this._container.container.resize();
      } else {
        const container = this._createContainerFromRegion(region);
        const index = region === StackRegion.NORTH || region === StackRegion.WEST ? 0 : -1;
        
        this._container.replaceChild(this, container, { destroy: false, render: false });
        
        container.addChild(this, { render: false });
        container.addChild(item, { render: false, index });
      }
    }
        
    this._renderer.render();
  }

  private _createContainerFromRegion(region: StackRegion): Row|Column {
    const RowOrColumn = this._getContainerDropType(region);

    return Injector.fromInjectable(RowOrColumn, [
      { provide: ContainerRef, useValue: null },
      { provide: ConfigurationRef, useValue: {} },
      RowOrColumn
    ], this._container.injector).get(RowOrColumn);
  }

  private _getContainerDropType(region: StackRegion): typeof Row|typeof Column {
    return region === StackRegion.EAST || region === StackRegion.WEST ? Row : Column;
  }

  private _onTabClose(e: TabCloseEvent): void {
    const container = this.getAtIndex(this.getIndexOfTab(e.target)) as StackItemContainer|null;

    if (container) {
      const event = e.delegate(StackItemCloseEvent, container);
      
      this._eventBus.next(event);
      
      event.results().subscribe(() => {
        this.removeChild(container);
      });
    }
  }

  private _onTabSelect(e: TabSelectionEvent): void {
    this.setActiveTab(e.target);
  }
  
  private _onTabDrag(e: TabDragEvent): void {
    const item = this.getAtIndex(this.getIndexOfTab(e.target)) as StackItemContainer|null;
    
    if (item) {
      this.removeChild(item, { destroy: false });
    }
  }

  private _setActiveIndex(index?: number): void {
    if (!isNumber(index)) {
      return;
    }
    
    this._activeIndex = clamp(index, 0, this._contentItems.length - 1);
  }

  static configure(config: StackConfig): ConfiguredRenderable<Stack> {
    return new ConfiguredRenderable(Stack, config);
  }
}