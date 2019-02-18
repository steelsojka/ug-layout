import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import { takeUntil } from 'rxjs/operators';

import { Inject, PostConstruct } from '../di';
import {
  Renderable,
  ConfiguredRenderable,
  RenderableArea,
  AddChildArgs,
  RenderableConfig
} from '../dom';
import { Stack } from './Stack';
import { Draggable } from '../Draggable';
import { DragHost } from '../DragHost';
import { StackTab, StackTabConfigArgs } from './StackTab';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { TabDragEvent } from './TabDragEvent';
import { get, partition, propEq } from '../utils';
import { STACK_TAB_CLASS } from './common';
import {
  ConfigurationRef,
  ContainerRef,
  DropTarget,
  DropArea,
  HighlightCoordinateArgs,
  DragEvent,
  RenderableArg
} from '../common';
import { StackControl, StackControlPosition } from './controls';
import { StackItemContainer } from './StackItemContainer';

export interface StackHeaderConfig extends RenderableConfig {
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
  private _tabAreas: RenderableArea[];

  @Inject(ConfigurationRef) protected _config: StackHeaderConfig;
  @Inject(ContainerRef) protected _container: Stack;
  @Inject(DragHost) protected _dragHost: DragHost;
  @Inject(STACK_TAB_CLASS) protected _StackTab: typeof StackTab;

  get width(): number {
    return this._container.isHorizontal ? this._container.width : this._config.size;
  }

  get height(): number {
    return this._container.isHorizontal ? this._config.size : this._container.height;
  }

  get size(): number {
    return get(this._config, 'size', DEFAULT_STACK_HEADER_SIZE);
  }

  get droppable(): boolean {
    return get(this._config, 'droppable', true);
  }

  get isHorizontal(): boolean {
    return this._container.isHorizontal;
  }

  get isDistributed(): boolean {
    return get(this._config, 'distribute', false);
  }

  get controls(): StackControl[] {
    return this._controls.slice(0);
  }

  @PostConstruct()
  initialize(): void {
    this._config = Object.assign({
      controls: [],
      size: DEFAULT_STACK_HEADER_SIZE,
      droppable: true,
      distribute: false
    }, this._config);

    super.initialize();

    this._dragHost.start
      .pipe(takeUntil(this.destroyed))
      .subscribe(this._onDragHostStart.bind(this));

    this._dragHost.dropped
      .pipe(takeUntil(this.destroyed))
      .subscribe(this._onDragHostDropped.bind(this));
  }

  addTab(config: StackTabConfigArgs, options: AddChildArgs = {}): StackTab {
    const tab = this.createChild(new ConfiguredRenderable(this._StackTab, config), [ Draggable ]);

    tab.subscribe(TabSelectionEvent, e => this.emit(e));
    tab.subscribe(TabCloseEvent, e => this.emit(e));
    tab.subscribe(TabDragEvent, e => this.emit(e));

    this.addChild(tab, options);

    return tab;
  }

  addControl(_control: RenderableArg<StackControl>): void {
    this._controls.push(this.createChild(_control));
  }

  isTabActive(tab: StackTab): boolean {
    return this._container.isActiveTab(tab);
  }

  getItemFromTab(tab: StackTab): StackItemContainer|null {
    return this._container.getAtIndex(this.getIndexOf(tab)) as StackItemContainer|null;
  }

  render(): VNode {
    const [ postTabControls, preTabControls ] = partition(
      this._controls.filter(c => c.isActive()),
      propEq('position', StackControlPosition.POST_TAB)
    );

    return h('div.ug-layout__stack-header', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    },
      [
        h('div.ug-layout__stack-controls', preTabControls.map(c => c.render())),
        h(
          'div.ug-layout__tab-container',
          this._contentItems.reduce((items, tab) => {
            const item = this.getItemFromTab(tab);

            if (item && item.isRenderable()) {
              items.push(tab.render());
            }

            return items;
          }, [] as VNode[])),
        h('div.ug-layout__stack-controls', postTabControls.map(c => c.render()))
      ]
    );
  }

  isDroppable(): boolean {
    return this.droppable;
  }

  getChildren(): Renderable[] {
    return [
      ...this._controls,
      ...this._contentItems
    ];
  }

  handleDrop(item: Renderable, dropArea: DropArea, e: DragEvent<Renderable>): void {
    const index = this._getIndexFromArea(e.pageX, e.pageY, dropArea.area) + 1;

    if (item instanceof StackItemContainer && this._container.getIndexOf(item) === -1) {
      this._container.addChild(item, { index });
      this._container.setActiveIndex(index);
    }

    this.onDropHighlightExit();
  }

  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea {
    let { pageX, pageY, dragArea, dropArea: { area: { x, y, y2 } } } = args;

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
    this._tabAreas = this._contentItems
      .filter(tab => tab.isRenderable())
      .map(tab => tab.getArea());
  }

  private _onDragHostDropped(): void {
    this._tabAreas = [];
  }

  private _getIndexFromArea(pageX: number, pageY: number, area: RenderableArea): number {
    let { x } = area;

    const deltaX = pageX - x;

    let result = -1;

    for (const [ index, tabArea ] of this._tabAreas.entries()) {
      if (deltaX >= (tabArea.x - x) + (tabArea.width / 2)) {
        result = index;
      }
    }

    return result;
  }
}