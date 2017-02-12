import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di';
import { 
  RenderableInjector, 
  Renderable, 
  ConfiguredRenderable,
  Renderer
} from '../dom';
import { BeforeDestroyEvent, BusEvent, Subject, Observable } from '../events';
import { ConfigurationRef, ContainerRef, RenderableArg, XYDirection } from '../common';
import { XYItemContainer, XYItemContainerConfig } from '../XYItemContainer';
import { StackHeader, StackHeaderConfigArgs } from './StackHeader';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { StackItemCloseEvent } from './StackItemCloseEvent';
import { StackItemContainer, StackItemContainerConfig } from './StackItemContainer';
import { StackTab } from './StackTab';
import { clamp, get, isNumber } from '../utils';

export interface StackConfig {
  children: StackItemContainerConfig[];
  startIndex?: number;
  direction?: XYDirection;
  reverse?: boolean;
  header?: StackHeaderConfigArgs;
}

export interface StackEntry {
  item: StackItemContainer;
  tab: StackTab;
}

export class Stack extends Renderable {
  getIndexOfContainer: (container: StackItemContainer) => number = this._getIndexOf.bind(this, 'item');
  getIndexOfTab: (tab: StackTab) => number = this._getIndexOf.bind(this, 'tab');
  isActiveContainer: (container: StackItemContainer) => boolean = this._isActive.bind(this, 'item');
  isActiveTab: (tab: StackTab) => boolean = this._isActive.bind(this, 'tab');
  getContainerAtIndex: (index: number) => StackItemContainer|null = this._getAtIndex.bind(this, 'item');
  getTabAtIndex: (index: number) => StackTab|null = this._getAtIndex.bind(this, 'tab');
  setActiveContainer: (container: StackItemContainer) => void = this._setActive.bind(this, 'item');
  setActiveTab: (tab: StackTab) => void = this._setActive.bind(this, 'tab');
  removeContainer: (container: StackItemContainer) => void = this._remove.bind(this, 'item');
  removeTab: (tab: StackTab) => void = this._remove.bind(this, 'tab');
  
  private _children: StackEntry[] = [];
  private _direction: XYDirection;
  private _header: StackHeader;
  private _activeIndex: number = 0;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackConfig|null,
    @Inject(Renderer) private _renderer: Renderer,
    @Inject(ContainerRef) protected _container: Renderable
  ) {
    super(_container);
    
    this._header = Injector.fromInjectable(
      StackHeader, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: Stack, useValue: this },
        { provide: ConfigurationRef, useValue: this._config ? this._config.header : null },
        StackHeader 
      ], 
      this._injector
    )
      .get(StackHeader);

    this._header.subscribe(TabCloseEvent, this._onTabClose.bind(this));
    this._header.subscribe(TabSelectionEvent, this._onTabSelect.bind(this));
    
    if (this._config) {
      this._config.children.forEach(child => this.addChild(child));
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
      ...this._children.map(child => child.item.render())  
    ]);
  }

  resize(): void {
    this._header.resize();
    super.resize();
  }

  addChild(config: StackItemContainerConfig): void {
    const item = Injector.fromInjectable(
      StackItemContainer, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: Stack, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        StackItemContainer
      ],
      this._injector
    )
      .get(StackItemContainer) as StackItemContainer

    const tab = this._header.addTab({
      maxSize: get<number>(this._config, 'header.maxTabSize', 200),
      title: config.title
    });

    this._children.push({ item, tab });
  }

  setActiveIndex(index?: number): void {
    this._setActiveIndex(index);
    this._renderer.render();
  }

  removeAtIndex(index: number): void {
    if (index >= this._children.length && index < 0) {
      return;      
    }

    const entry = this._children[index];

    entry.item.destroy();

    if (!entry.tab.isDestroyed) {
      this._header.removeTab(entry.tab);
    }

    this._children.splice(index, 1);

    if (this._children.length) {
      this._activeIndex = clamp(this._activeIndex, 0, this._children.length - 1);
    } else {
      this.destroy();
    }
    
    this._renderer.render();
  }

  destroy(): void {
    this._header.destroy();

    for (const { item } of this._children) {
      item.destroy();
    }

    super.destroy();
  }

  getChildren(): StackItemContainer[] {
    return this._children.map(entry => entry.item);
  }

  private _onTabClose(e: TabCloseEvent): void {
    const container = this.getContainerAtIndex(this.getIndexOfTab(e.target));

    if (container) {
      this._eventBus.next(e.delegate(StackItemCloseEvent, container));
    }
  }

  private _onItemTransfer(item: StackItemContainer): void {
    const index = this.getIndexOfContainer(item);

    if (index !== -1) {
      this._children.splice(index, 1);
    }
  }

  private _remove(entryKey: keyof StackEntry, item: StackItemContainer|StackTab): void {
    this.removeAtIndex(this._getIndexOf(entryKey, item));
  }

  private _getAtIndex(entryKey: keyof StackEntry, index: number): StackItemContainer|StackTab|null {
    const entry = this._children[index];

    return entry ? entry[entryKey] : null;
  }

  private _getIndexOf(entryKey: keyof StackEntry, item: StackItemContainer|StackTab): number {
    for (const [ index, entry ] of this._children.entries()) {
      if (entry[entryKey] === item) {
        return index;
      }
    }

    return -1;
  }

  private _isActive(entryKey: keyof StackEntry, item: StackItemContainer|StackTab): boolean {
    return this._getIndexOf(entryKey, item) === this.activeIndex;
  }
  
  private _setActive(entryKey: keyof StackEntry, item: StackItemContainer|StackTab): void {
    this.setActiveIndex(this._getIndexOf(entryKey, item));
  }

  private _onTabSelect(e: TabSelectionEvent): void {
    this.setActiveTab(e.target);
  }

  private _setActiveIndex(index?: number): void {
    if (!isNumber(index)) {
      return;
    }
    
    this._activeIndex = clamp(index, 0, this._children.length - 1);
  }

  static configure(config: StackConfig): ConfiguredRenderable<Stack> {
    return new ConfiguredRenderable(Stack, config);
  }
}