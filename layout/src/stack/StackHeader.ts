import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di';
import { 
  Renderable, 
  RenderableInjector, 
  ConfiguredRenderable, 
  RenderableArea,
  AddChildArgs,
  RemoveChildArgs
} from '../dom';
import { Stack } from './Stack';
import { Draggable } from '../Draggable';
import { DragHost } from '../DragHost';
import { StackTab, StackTabConfigArgs } from './StackTab';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { TabDragEvent } from './TabDragEvent';
import { isNumber } from '../utils';
import { 
  ConfigurationRef, 
  ContainerRef, 
  DropTarget, 
  DropArea, 
  HighlightCoordinateArgs,
  DragEvent,
  RenderableArg
} from '../common';
import { Subject, Observable, BeforeDestroyEvent } from '../events';
import { StackControl } from './controls';
import { StackItemContainer } from './StackItemContainer';

export interface StackHeaderConfig {
  size: number;
  distribute: boolean;
  droppable: boolean;
}

export type StackHeaderConfigArgs = {
  [P in keyof StackHeaderConfig]?: StackHeaderConfig[P];
}

export const DEFAULT_STACK_HEADER_SIZE = 25;

export class StackHeader extends Renderable implements DropTarget {
  protected _contentItems: StackTab[] = [];
  private _controls: StackControl[] = [];
  private _config: StackHeaderConfig;
  private _tabAreas: RenderableArea[];
  
  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) _config: StackHeaderConfigArgs|null,
    @Inject(ContainerRef) protected _container: Stack,
    @Inject(DragHost) protected _dragHost: DragHost
  ) {
    super(_injector);
    
    this._config = Object.assign({
      controls: [],
      size: DEFAULT_STACK_HEADER_SIZE,
      droppable: true,
      distribute: false
    }, _config);

    this._dragHost.start
      .takeUntil(this.destroyed)
      .subscribe(this._onDragHostStart.bind(this));
      
    this._dragHost.dropped
      .takeUntil(this.destroyed)
      .subscribe(this._onDragHostDropped.bind(this));
  } 

  get width(): number {
    return this._container.isHorizontal ? this._container.width : this._config.size;
  }

  get height(): number {
    return this._container.isHorizontal ? this._config.size : this._container.height;
  }

  get isHorizontal(): boolean {
    return this._container.isHorizontal;
  }

  get isDistributed(): boolean {
    return Boolean(this._config.distribute);
  }

  addTab(config: StackTabConfigArgs, options: AddChildArgs = {}): StackTab {
    const tab = Injector.fromInjectable(
      StackTab, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        Draggable,
        StackTab 
      ],
      this._injector
    )
      .get(StackTab) as StackTab;

    tab.subscribe(TabSelectionEvent, e => this.emit(e));
    tab.subscribe(TabCloseEvent, e => this.emit(e));
    tab.subscribe(TabDragEvent, e => this.emit(e));

    this.addChild(tab, options);

    return tab;
  }

  addControl(_control: RenderableArg<StackControl>): void {
    const control = RenderableInjector.fromRenderable(
      _control, 
      [
        { provide: ContainerRef, useValue: this }
      ],
      this.injector 
    )
      .get(ConfiguredRenderable);

    this._controls.push(control);
  }

  isTabActive(tab: StackTab): boolean {
    return this._container.isActiveTab(tab);
  }

  getItemFromTab(tab: StackTab): StackItemContainer|null {
    return this._container.getAtIndex(this.getIndexOf(tab)) as StackItemContainer|null;
  }

  render(): VNode {
    return h('div.ug-layout__stack-header', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, 
      [
        h('div.ug-layout__tab-container', this._contentItems.map(tab => tab.render())),
        h('div.ug-layout__stack-controls', this._controls.filter(c => c.isActive()).map(c => c.render()))
      ]
    );
  }

  isDroppable(): boolean {
    return true;
  }

  getChildren(): Renderable[] {
    return [
      ...this._controls,
      ...this._contentItems
    ];
  }

  handleDrop(item: Renderable, dropArea: DropArea, e: DragEvent<Renderable>): void {
    const index = this._getIndexFromArea(e.pageX, e.pageY, dropArea.area) + 1;
    
    if (item instanceof StackItemContainer) {
      if (this._container.getIndexOf(item) === -1) {
        this._container.addChild(item, { index });
        this._container.setActiveIndex(index);
      } else {
      }
    } 

    this.onDropHighlightExit();
  }

  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea {
    let { pageX, pageY, dragArea, dropArea: { item, area: { x, x2, y, y2, height } } } = args;
    
    const highlightArea = new RenderableArea(x, dragArea.width + x, y, y2);
    let leftMostTabIndex = this._getIndexFromArea(pageX, pageY, args.dropArea.area);
    let leftMostTabArea = this._tabAreas[leftMostTabIndex];

    if (leftMostTabArea) {
      highlightArea.x = leftMostTabArea.x2;
      highlightArea.x2 = leftMostTabArea.x2 + dragArea.width;
    }

    for (const [ index, tab ] of this._contentItems.entries()) {
      if (!tab.isDragging) {
        tab.element.style.transform = index > leftMostTabIndex ? `translateX(${dragArea.width}px)` : 'translateX(0px)';
      }
    }
    
    return highlightArea;
  }

  onDropHighlightExit(): void {
    for (const tab of this._contentItems) {
      if (!tab.isDragging) {
        tab.element.style.transform = 'translateX(0px)';
      }
    }
  }

  getOffsetXForTab(tab: StackTab): number {
    if (this.isHorizontal) {
      return this._contentItems.slice(0, this.getIndexOf(tab)).reduce((result, tab) => result + tab.width, this.offsetX);
    }
    
    return this.offsetX;
  }
  
  getOffsetYForTab(tab: StackTab): number {
    if (!this.isHorizontal) {
      return this._contentItems.slice(0, this.getIndexOf(tab)).reduce((result, tab) => result + tab.height, this.offsetY);
    }

    return this.offsetY;
  }

  private _onDragHostStart(): void {
    this._tabAreas = this._contentItems.map(tab => tab.getArea());
  }
  
  private _onDragHostDropped(): void {
    this._tabAreas = [];
  }

  private _getIndexFromArea(pageX: number, pageY: number, area: RenderableArea): number {
    let { x, y } = area;
    
    const deltaX = pageX - x;
    const deltaY = pageY - y;

    let result = -1;

    for (const [ index, tabArea ] of this._tabAreas.entries()) {
      if (deltaX >= (tabArea.x - x) + (tabArea.width / 2)) {
        result = index;
      }
    }

    return result;
  }
}