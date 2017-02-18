import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { 
  Renderer, 
  Renderable, 
  RenderableInjector, 
  ConfiguredRenderable,
  AddChildArgs
} from './dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  XYDirection, 
  UNALLOCATED,
  RenderableArg
} from './common';
import { isNumber } from './utils';
import { BeforeDestroyEvent } from './events';
import { XYContainer } from './XYContainer';
import { MinimizeCommand } from './commands';
import { Splitter } from './Splitter';

export interface XYItemContainerConfig {
  use: RenderableArg<Renderable>;
  ratio?: number;
  minSizeX?: number;
  maxSizeX?: number;
  minSizeY?: number;
  maxSizeY?: number;
  fixed?: boolean;
}

export class XYItemContainer extends Renderable {
  ratio: number|typeof UNALLOCATED = UNALLOCATED;
  
  protected _height: number = 0;
  protected _width: number = 0;
  protected _container: XYContainer;
  
  private _lastSize: number|null = null;
  private _isMinimized: boolean = false;

  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) private _config: XYItemContainerConfig,
    @Inject(ContainerRef) _container: XYContainer
  ) {
    super(_injector);
    
    if (this._config) {
      this.ratio = isNumber(this._config.ratio) ? this._config.ratio : UNALLOCATED;
    }

    this._contentItems = [
      RenderableInjector.fromRenderable(
        this._config.use, 
        [
          { provide: XYItemContainer, useValue: this },
          { provide: ContainerRef, useValue: this }
        ], 
        this._injector
      )
        .get(ConfiguredRenderable)
    ];

    this.subscribe(MinimizeCommand, this._minimize.bind(this));
  }

  get size(): number {
    return this._container.isRow ? this.width : this.height;
  }

  get minSize(): number {
    return this._container.isRow ? this.minSizeX : this.minSizeY;
  }
  
  get maxSize(): number {
    return this._container.isRow ? this.maxSizeX : this.maxSizeY;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get minSizeX(): number {
    return isNumber(this._config.minSizeX) ? this._config.minSizeX : 50;
  }

  get maxSizeX(): number {
    return isNumber(this._config.maxSizeX) ? this._config.maxSizeX : Number.MAX_SAFE_INTEGER;
  }
  
  get minSizeY(): number {
    return isNumber(this._config.minSizeY) ? this._config.minSizeY : 50;
  }

  get maxSizeY(): number {
    return isNumber(this._config.maxSizeY) ? this._config.maxSizeY : Number.MAX_SAFE_INTEGER;
  }

  get isMinimized(): boolean {
    return this._isMinimized;
  }

  get fixed(): boolean {
    return Boolean(this._config.fixed);
  }

  get isRow(): boolean {
    return this._container.isRow;
  }

  get container(): XYContainer {
    return this._container;
  }

  get isUnallocated(): boolean {
    return this.ratio === UNALLOCATED;
  }

  get offsetX(): number {
    let offset = this._container ? this._container.offsetX : 0;
    
    if (this._container.isRow) {
      const children = this._container.getChildren();
      const index = children.indexOf(this);
      const prev = children.slice(0, index);
      const totalSplitterSize = this._container.getTotalSplitterSizes(0, index);

      return prev.reduce((result, item) => result + item.width, offset) + totalSplitterSize;
    }

    return offset;
  }

  get offsetY(): number {
    let offset = this._container ? this._container.offsetY : 0;
    
    if (!this._container.isRow) {
      const children = this._container.getChildren();
      const index = children.indexOf(this);
      const prev = children.slice(0, index);
      const totalSplitterSize = this._container.getTotalSplitterSizes(0, index);

      return prev.reduce((result, item) => result + item.height, offset) + totalSplitterSize;
    }

    return offset;
  }

  get item(): Renderable {
    return this._item;
  }

  protected get _item(): Renderable {
    return this._contentItems[0];
  }

  render(): VNode {
    return h('div.ug-layout__xy-item-container', {
      key: this._uid,
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, [
      this._item.render()
    ]);
  }

  setSize(args: { width: number, height: number }): void {
    this._width = args.width;
    this._height = args.height;
  }

  isVisible(): boolean {
    return !this._isMinimized && this._container.isVisible();
  }

  addChild(item: Renderable, options?: AddChildArgs): void {
    this._container.addChild(item, options);
  }

  private _minimize(e: MinimizeCommand<Renderable>): void {
    const minimize = e.minimize == null ? !this._isMinimized : e.minimize;
    const splitter = this._container.getSplitterFromItem(this);
    let size: number|null = null;
    
    e.stopPropagation();
    
    if (minimize && !this._isMinimized) {
      size = e.size;
      this._lastSize = this.size;
      this._isMinimized = true;

      if (splitter) {
        splitter.disable();
      }
    } else if (!minimize && this._isMinimized && this._lastSize != null) {
      size = this._lastSize;
      this._isMinimized = false;
      this._lastSize = null;
      
      if (splitter) {
        splitter.enable();
      }
    }

    if (size != null) {
      this._container.setSizeOf(this, size);
    }
  }
}