import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { 
  Renderable, 
  RenderableInjector,
  ConfiguredRenderable,
  Renderer,
  AddChildArgs,
  RenderableConfig
} from '../dom';
import { Inject, Injector, Optional } from '../di';
import { 
  ContainerRef, 
  XYDirection,
  ConfigurationRef,
  RenderableArg,
  UNALLOCATED,
  DragStatus,
  DragEvent
} from '../common';
import { XYItemContainer, XYItemContainerConfig } from './XYItemContainer';
import { Draggable } from '../Draggable';
import { BeforeDestroyEvent } from '../events';
import { Splitter, SPLITTER_SIZE } from './Splitter';
import { get, isNumber, clamp, round } from '../utils';
import { Stack, StackItemContainer } from '../stack';

export interface XYContainerConfig extends RenderableConfig {
  /**
   * The size in pixels of the splitter.
   * @type {number}
   */
  splitterSize?: number;
  /**
   * Determines whether the Row or Column should persist when only a single item remains.
   * The default behavior is to unwrap and destroy the row or column.
   * @type {boolean}
   */
  static?: boolean;
  children: XYItemContainerConfig[];
}

export interface XYSizingOptions {
  distribute?: boolean;
}

export interface ContainerAddChildArgs extends AddChildArgs {
  distribute?: boolean;
}

export type AdjacentResults = { before: XYItemContainer|null, after: XYItemContainer|null };

export const MAX_RATIO_DISTRIBUTION_ITERATIONS = 5;

export class XYContainer extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;
  protected _contentItems: XYItemContainer[] = [];
  protected _splitters: Splitter[] = [];
  protected _dragLimitMin: number = 0;
  protected _dragLimitMax: number = 0;
  protected _container: Renderable|null;

  constructor(
    @Inject(ConfigurationRef) @Optional() protected _config: XYContainerConfig|null
  ) {
    super();
  }

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }

  get direction(): XYDirection {
    return this._direction;
  }

  get isRow(): boolean {
    return this.direction === XYDirection.X;
  }

  get splitters(): Splitter[] {
    return this._splitters;
  }

  get splitterSize(): number {
    return get(this._config, 'splitterSize', SPLITTER_SIZE);
  }

  get isStatic(): boolean {
    return get(this._config, 'static', false);
  }

  protected get _totalSplitterSize(): number {
    return this._splitters.reduce((result, splitter) => result + splitter.size, 0);
  }

  protected get _totalContainerSize(): number {
    if (!this._container) {
      return 0;
    }
    
    return this.isRow 
      ? this._container.width - this._totalSplitterSize
      : this._container.height - this._totalSplitterSize;
  }

  initialize(): void {
    super.initialize();
    
    const children = this._config && this._config.children ? this._config.children : [];
    
    children.forEach(config => {
      return this.addChild(this.createChildItem(config), { render: false, resize: false });
    });
  }

  createChildItem(config: XYItemContainerConfig, options: { index?: number } = {}): XYItemContainer {
    return this.createChild(new ConfiguredRenderable(XYItemContainer, config));
  }

  addChild(item: Renderable, options: ContainerAddChildArgs = {}): void {
    const { distribute = true, resize = true } = options;
    const childArgs = Object.assign({}, options, { render: false, resize: false });
    let container: XYItemContainer;
    
    // If this is an item container just add it.
    if (!(item instanceof XYItemContainer)) {
      if (item instanceof StackItemContainer) {
        item = this._createStackWrapper(item);
      }
      
      container = this.createChildItem({ use: item }, childArgs);

      item.setContainer(container);
    } else {
      container = item;
    }

    if (resize) {
      let newItemRatio;
      
      if (container.initialSize != null) {
        newItemRatio = (container.initialSize / this._totalContainerSize) * 100;
      } else {
        newItemRatio = (1 / (this._contentItems.length + 1)) * 100;
      }

      container.ratio = newItemRatio;
      
      for (const item of this._contentItems) {
        item.ratio = <number>item.ratio * ((100 - newItemRatio) / 100);
      }
    }
    
    while (this._splitters.length < this._contentItems.length) {
      this._splitters.push(this._createSplitter());
    }
      
    super.addChild(container, options);
  }

  removeChild(item: XYItemContainer): void {
    const index = this._contentItems.indexOf(item);

    if (index === -1) {
      return;
    }

    const splitterIndex = clamp(index, 0, this._splitters.length - 1);
    const splitter = this._splitters[splitterIndex];

    if (splitter) {
      this._splitters.splice(splitterIndex, 1);
      splitter.destroy();
    }

    super.removeChild(item, { render: false });

    if (this._contentItems.length === 1 && this.container && get(this._config, 'static') !== true) {
      const container = this._contentItems[0];
      const item = container.item;
      
      this._contentItems = [];
      this.container.replaceChild(this, item, { destroy: true, render: false });
      
      container.setContainer(null);
      container.removeChild(item, { destroy: false });
    }
    
    this.resize();
    this._renderer.render();
  }
  
  render(): VNode {
    const children: VNode[] = [];

    for (const [ index, child ] of this._contentItems.entries()) {
      if (index > 0 && this._splitters[index - 1]) {
        children.push(this._splitters[index - 1].render());
      }
      
      children.push(child.render());
    }
    
    return h(`div.${this._className}`, {
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, children);
  }

  resize(): void {
    this._height = this._container ? this._container.height : 0 ;
    this._width = this._container ? this._container.width : 0;

    this._calculateRatios();
    this._setDimensions();

    super.resize();
  }

  setSizeOf(item: XYItemContainer, size: number, options: XYSizingOptions = {}): void {
    const { distribute = false } = options;
    const { before, after } = this.getAdjacentItems(item);
    const prevRatio = item.ratio;
    
    item.ratio = (size / this._totalContainerSize) * 100;

    if (after && isNumber(after.ratio)) {
      after.ratio = Math.max(0, after.ratio + (<number>prevRatio - item.ratio));
    } else if (before && isNumber(before.ratio)) {
      before.ratio = Math.max(0, before.ratio + (<number>prevRatio - item.ratio));
    }

    this.resize();
    this._renderer.render();
  }

  getChildren(): XYItemContainer[] {
    return super.getChildren() as XYItemContainer[];
  }

  getAdjacentItems(item: XYItemContainer): AdjacentResults {
    const index = this._contentItems.indexOf(item);

    return {
      before: index > 0 ? this._contentItems[index - 1] : null,
      after: index < this._contentItems.length - 1 ? this._contentItems[index + 1] : null
    };
  }

  getSplitterFromItem(item: XYItemContainer): Splitter|null {
    const index = this._contentItems.indexOf(item);

    if (index === -1) {
      return null;
    }

    if (index < this._contentItems.length - 1) {
      return this._splitters[index] || null;
    }

    return this._splitters[index - 1] || null;
  }

  getTotalSplitterSizes(start: number = 0, end: number = this._splitters.length - 1): number {
    return this._splitters.slice(start, end).reduce((res, sptr) => res + sptr.size, 0);
  }

  private _createSplitter(): Splitter {
    const splitterConfig = {
      size: this._config && this._config.splitterSize ? this._config.splitterSize : SPLITTER_SIZE,
      disabler: this._isSplitterDisabled.bind(this)
    };

    const splitter = this.createChild(new ConfiguredRenderable(Splitter, splitterConfig), [ Draggable ]);

    splitter.dragStatus.subscribe(this._dragStatusChanged.bind(this));

    return splitter;
  }

  private _isSplitterDisabled(splitter: Splitter): boolean {
    const { before, after } = this._getSplitterItems(splitter);

    return before.isMinimized || after.isMinimized;
  }

  private _dragStatusChanged(event: DragEvent<Splitter>): void {
    switch (event.status) {
      case DragStatus.START: return this._dragStart(event);
      case DragStatus.STOP: return this._dragEnd(event);
      case DragStatus.DRAGGING: return this._dragMove(event);
    }
  }

  private _getSplitterItems(splitter: Splitter): { before: XYItemContainer, after: XYItemContainer } {
    const index = this._splitters.indexOf(splitter);

    return {
      before: this._contentItems[index],
      after: this._contentItems[index + 1]
    };
  }

  private _dragStart(event: DragEvent<Splitter>): void {
    const { host } = event;
    const { before, after } = this._getSplitterItems(host);
    
    this._dragLimitMin = Math.max((-before.size + before.minSize), -(after.maxSize - after.size));
    this._dragLimitMax = Math.min(after.size - after.minSize, before.maxSize - before.size);
  }

  private _dragEnd(event: DragEvent<Splitter>): void {
    let { host, x, y } = event;
    
    host.dragTo(0, 0);

    x = clamp(x, this._dragLimitMin, this._dragLimitMax);
    y = clamp(y, this._dragLimitMin, this._dragLimitMax);

    this._updateSplitterItems(host, x, y);
    this._renderer.render();
  }

  private _updateSplitterItems(splitter: Splitter, x: number, y: number): void {
    const { before, after } = this._getSplitterItems(splitter);
    const totalContainerSize = this._totalContainerSize;
    
    if (this.isRow) {
      before.ratio = ((before.width + x) / totalContainerSize) * 100;
      after.ratio = ((after.width - x) / totalContainerSize) * 100;
    } else {
      before.ratio = ((before.height + y) / totalContainerSize) * 100;
      after.ratio = ((after.height - y) / totalContainerSize) * 100;
    }

    this.resize();
  }
  
  private _dragMove(event: DragEvent<Splitter>): void {
    if (this.isRow) {
      event.host.dragTo(clamp(event.x, this._dragLimitMin, this._dragLimitMax), event.host.y);
    } else {
      event.host.dragTo(event.host.x, clamp(event.y, this._dragLimitMin, this._dragLimitMax));
    }
  }

  private _setDimensions(): void {
    const totalSplitterSize = this._totalSplitterSize;
    let total = 0;
    let totalWidth = this._width;
    let totalHeight = this._height;
    let sizes: number[] = [];

    if (this.isRow) {
      totalWidth -= totalSplitterSize;
    } else {
      totalHeight -= totalSplitterSize;
    }

    for (const child of this._contentItems) {
      let size = (this.isRow ? totalWidth : totalHeight) * (<number>child.ratio / 100);

      total += size;
      sizes.push(size);
    }

    const extraPixels = Math.floor((this.isRow ? totalWidth : totalHeight) - total);

    for (const [ index, child ] of this._contentItems.entries()) {
      if (extraPixels - index > 0) {
        sizes[index]++;
      }

      if (this.isRow) {
        child.setSize({ width: sizes[index], height: totalHeight });
      } else {
        child.setSize({ width: totalWidth, height: sizes[index] });
      }
    }
  }

  private _calculateRatios(): void {
    let total = 0;
    const unallocatedChildren: XYItemContainer[] = [];

    if (!this._contentItems.length) {
      return;
    }

    for (const child of this._contentItems) {
      if (child.ratio !== UNALLOCATED) {
        total += child.ratio as number;
      } else {
        unallocatedChildren.push(child);
      }
    }

    if (Math.round(total) === 100) {
      this._distributeRatios();
    
      return;
    }

    if (Math.round(total) < 100 && unallocatedChildren.length) {
      for (const child of unallocatedChildren) {
        child.ratio = (100 - total) / unallocatedChildren.length
      }
    } else {
      if (Math.round(total) > 100) {
        for (const child of unallocatedChildren) {
          child.ratio = 50;
          total += 50;
        }
      } 
      
      for (const child of this._contentItems) {
        child.ratio = (<number>child.ratio / total) * 100;
      }
    }

    this._distributeRatios();
  }
  
  private _distributeRatios(_iterationCount: number = 0): void {
    // Recursion alert. Check for inifinite loop here.
    const growable: XYItemContainer[] = [];
    const shrinkable: XYItemContainer[] = [];
    const containerSize = this._totalContainerSize;
    let totalRatio = 0;

    for (const child of this._contentItems) {
      const minRatio = !child.isMinimized ? (child.minSize / containerSize) * 100 : 0;
      const maxRatio = (child.maxSize / containerSize) * 100;
      
      child.ratio = clamp(child.ratio, minRatio, maxRatio);
      totalRatio += child.ratio;
      
      const size = containerSize * (<number>child.ratio / 100);

      if (size < child.maxSize) {
        growable.push(child);
      }

      if (size > child.minSize) {
        shrinkable.push(child);
      }
    }

    if (round(totalRatio, 2) > 100) {
      for (const child of shrinkable) {
        child.ratio = <number>child.ratio - ((totalRatio - 100) / shrinkable.length);
      }
    } else if (totalRatio < 100) {
      for (const child of growable) {
        child.ratio = <number>child.ratio + ((100 - totalRatio) / growable.length);
      }
    }

    totalRatio = this._contentItems.reduce((r, i) => r + <number>i.ratio, 0);
    
    for (const child of this._contentItems) {
      child.ratio = (<number>child.ratio / totalRatio) * 100;
    }
  }

  private _createStackWrapper(item: Renderable): Stack {
    const stack = this.createChild(new ConfiguredRenderable(Stack, null));

    stack.addChild(item, { render: false });

    return stack;
  }
}