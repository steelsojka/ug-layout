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
  UNALLOCATED
} from './common';
import { XYItemContainer, XYItemContainerConfig } from './XYItemContainer';
import { Splitter, SPLITTER_SIZE, SplitterDragEvent, SplitterDragStatus } from './Splitter';
import { isNumber, clamp } from './utils';

export interface XYContainerConfig {
  splitterSize?: number;
  children: XYItemContainerConfig[];
}

export class XYContainer extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;
  protected _children: XYItemContainer[] = [];
  protected _splitters: Splitter[] = [];
  protected _dragLimitMin: number = 0;
  protected _dragLimitMax: number = 0;

  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(ConfigurationRef) protected _config: XYContainerConfig|null,
    @Inject(Injector) protected _injector: Injector,
    @Inject(Renderer) protected _renderer: Renderer
  ) {
    super();
    
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

    for (const child of this._children) {
      child.resize();
    }
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
        Splitter
      ],
      this._injector
    )
      .get(Splitter) as Splitter;

    splitter.dragStatus.subscribe(this._dragStatusChanged.bind(this));

    return splitter;
  }

  private _dragStatusChanged(event: SplitterDragEvent): void {
    switch (event.dragStatus) {
      case SplitterDragStatus.START: return this._dragStart(event);
      case SplitterDragStatus.STOP: return this._dragEnd(event);
      case SplitterDragStatus.DRAGGING: return this._dragMove(event);
    }
  }

  private _getSplitterItems(splitter: Splitter): { before: XYItemContainer, after: XYItemContainer } {
    const index = this._splitters.indexOf(splitter);

    return {
      before: this._children[index],
      after: this._children[index + 1]
    };
  }

  private _dragStart(event: SplitterDragEvent): void {
    const { splitter } = event;
    const { before, after } = this._getSplitterItems(splitter);
    
    this._dragLimitMin = (this.isRow ? -before.width : -before.height);
    this._dragLimitMax = (this.isRow ? after.width : after.height) - 50;
  }

  private _dragEnd(event: SplitterDragEvent): void {
    let { splitter, x, y } = event;
    
    splitter.dragTo(0, 0);

    x = clamp(x, this._dragLimitMin, this._dragLimitMax);
    y = clamp(y, this._dragLimitMin, this._dragLimitMax);

    this._updateSplitterItems(splitter, x, y);
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
  
  private _dragMove(event: SplitterDragEvent): void {
    if (this.isRow) {
      event.splitter.dragTo(clamp(event.x, this._dragLimitMin, this._dragLimitMax), event.splitter.y);
    } else {
      event.splitter.dragTo(event.splitter.x, clamp(event.y, this._dragLimitMin, this._dragLimitMax));
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

    for (const child of this._children) {
      if (child.ratio !== UNALLOCATED) {
        total += child.ratio as number;
      } else {
        unallocatedChildren.push(child);
      }
    }

    if (Math.round(total) === 100) {
      return;
    }

    if (Math.round(total) < 100 && unallocatedChildren.length) {
      for (const child of unallocatedChildren) {
        child.ratio = (100 - total) / unallocatedChildren.length
      }

      return;
    }

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
}