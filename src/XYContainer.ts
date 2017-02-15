import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { 
  Renderable, 
  RenderableInjector,
  ConfiguredRenderable,
  Renderer
} from './dom';
import { Inject, Injector } from './di';
import { 
  ContainerRef, 
  XYDirectionRef, 
  XYDirection,
  ConfigurationRef,
  RenderableConfig,
  RenderableArg,
  UNALLOCATED,
  DragStatus,
  DragEvent 
} from './common';
import { XYItemContainer, XYItemContainerConfig } from './XYItemContainer';
import { Draggable } from './Draggable';
import { BeforeDestroyEvent } from './events';
import { Splitter, SPLITTER_SIZE } from './Splitter';
import { isNumber, clamp, round } from './utils';

export interface XYContainerConfig {
  splitterSize?: number;
  children: XYItemContainerConfig[];
}

export interface XYSizingOptions {
  distribute?: boolean;
}

type AdjacentResults = { before: XYItemContainer|null, after: XYItemContainer|null };

export const MAX_RATIO_DISTRIBUTION_ITERATIONS = 5;

export class XYContainer extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;
  protected _children: XYItemContainer[] = [];
  protected _splitters: Splitter[] = [];
  protected _dragLimitMin: number = 0;
  protected _dragLimitMax: number = 0;
  protected _container: Renderable;

  constructor(
    @Inject(ConfigurationRef) protected _config: XYContainerConfig|null,
    @Inject(Injector) protected _injector: Injector,
    @Inject(Renderer) protected _renderer: Renderer,
    @Inject(ContainerRef) _container: Renderable
  ) {
    super(_injector);
    
    const children = this._config && this._config.children ? this._config.children : [];
    
    this._children = children.map<XYItemContainer>(config => this.addChild(config));
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

  protected get _totalSplitterSize(): number {
    return this._splitters.reduce((result, splitter) => result + splitter.size, 0);
  }

  protected get _totalContainerSize(): number {
    return this.isRow 
      ? this._container.width - this._totalSplitterSize
      : this._container.height - this._totalSplitterSize;
  }

  addChild(config: XYItemContainerConfig, options: { index?: number } = {}) {
    const { index } = options

    const item = Injector.fromInjectable(
      XYItemContainer, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: XYContainer, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        XYItemContainer
      ],
      this._injector
    )
      .get(XYItemContainer) as XYItemContainer;
      
    if (typeof index === 'number') {
      this._children.splice(index, 0, item);
    } else {
      this._children.push(item);
    }

    while (this._splitters.length < this._children.length - 1) {
      this._splitters.push(this._createSplitter());
    }

    return item;
  }

  removeChild(item: XYItemContainer): void {
    const index = this._children.indexOf(item);

    if (index === -1) {
      return;
    }

    this._children.splice(index, 1);
    item.destroy();

    const splitterIndex = clamp(index, 0, this._splitters.length - 1);
    const splitter = this._splitters[splitterIndex];

    if (splitter) {
      this._splitters.splice(splitterIndex, 1);
      splitter.destroy();
    }
    
    this.resize();
    this._renderer.render();
  }
  
  render(): VNode {
    const children: VNode[] = [];

    for (const [ index, child ] of this._children.entries()) {
      if (index > 0) {
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

  destroy(): void {
    for (const child of this._children) {
      child.destroy();
    }

    super.destroy();
  }

  resize(): void {
    this._height = this._container.height;
    this._width = this._container.width;

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
    return [ ...this._children ];
  }

  getAdjacentItems(item: XYItemContainer): AdjacentResults {
    const index = this._children.indexOf(item);

    return {
      before: index > 0 ? this._children[index - 1] : null,
      after: index < this._children.length - 1 ? this._children[index + 1] : null
    };
  }

  getSplitterFromItem(item: XYItemContainer): Splitter|null {
    const index = this._children.indexOf(item);

    if (index === -1) {
      return null;
    }

    if (index < this._children.length - 1) {
      return this._splitters[index] || null;
    }

    return this._splitters[index - 1] || null;
  }

  getTotalSplitterSizes(start: number = 0, end: number = this._splitters.length - 1): number {
    return this._splitters.slice(start, end).reduce((res, sptr) => res + sptr.size, 0);
  }

  private _createSplitter(): Splitter {
    const splitterConfig = {
      size: this._config && this._config.splitterSize ? this._config.splitterSize : SPLITTER_SIZE
    };
  
    const splitter = Injector.fromInjectable(
      Splitter,
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: splitterConfig },
        Draggable,
        Splitter
      ],
      this._injector
    )
      .get(Splitter) as Splitter;

    splitter.dragStatus.subscribe(this._dragStatusChanged.bind(this));

    return splitter;
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
      before: this._children[index],
      after: this._children[index + 1]
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

    for (const child of this._children) {
      let size = (this.isRow ? totalWidth : totalHeight) * (<number>child.ratio / 100);

      total += size;
      sizes.push(size);
    }

    const extraPixels = Math.floor((this.isRow ? totalWidth : totalHeight) - total);

    for (const [ index, child ] of this._children.entries()) {
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

    if (!this._children.length) {
      return;
    }

    for (const child of this._children) {
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
      
      for (const child of this._children) {
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

    for (const child of this._children) {
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

    // If we can't completely redistribute cleanly. Average the remainder to all getAdjacentItems
    // and call it good. This will happen if we can't keep all items within their min/max bounds.
    if (_iterationCount >= MAX_RATIO_DISTRIBUTION_ITERATIONS) {
      for (const child of this._children) {
        child.ratio = (<number>child.ratio / totalRatio) * 100;
      }

      console.warn('Can not satisify all items min/max bounds. Please check configuration.');

      return;
    }

    if (round(totalRatio, 2) > 100) {
      for (const child of shrinkable) {
        child.ratio = <number>child.ratio - ((totalRatio - 100) / shrinkable.length);
      }

      this._distributeRatios(++_iterationCount);
    } else if (totalRatio < 100) {
      for (const child of growable) {
        child.ratio = <number>child.ratio + ((100 - totalRatio) / growable.length);
      }
      
      this._distributeRatios(++_iterationCount);
    }
  }
}