import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector, PostConstruct } from '../di'
import { 
  Renderer, 
  Renderable, 
  RenderableInjector, 
  ConfiguredRenderable,
  AddChildArgs,
  RenderableConfigArgs
} from '../dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  XYDirection, 
  UNALLOCATED,
  RenderableArg
} from '../common';
import { MakeVisibleCommand } from '../commands';
import { isNumber, isFunction } from '../utils';
import { BeforeDestroyEvent } from '../events';
import { XYContainer } from './XYContainer';
import { MinimizeCommand } from '../commands';
import { Splitter } from './Splitter';

export interface XYItemContainerConfig extends RenderableConfigArgs {
  use: RenderableArg<Renderable>;
  ratio?: number;
  persist?: boolean;
  initialSize?: number;
  minSizeX?: number;
  maxSizeX?: number;
  minSizeY?: number;
  maxSizeY?: number;
  fixed?: boolean;
  minimized?: boolean;
}

export class XYItemContainer extends Renderable {
  ratio: number|typeof UNALLOCATED = UNALLOCATED;

  @Inject(ConfigurationRef) protected _config: XYItemContainerConfig
  
  protected _height: number = 0;
  protected _width: number = 0;
  protected _container: XYContainer;
  
  private _lastSize: number|null = null;
  private _isMinimized: boolean = false;

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

  get initialSize(): number|null {
    return isNumber(this._config.initialSize) ? this._config.initialSize : null;
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

  get persist(): boolean {
    return this._config.persist !== false;
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

  @PostConstruct()
  initialize(): void {
    super.initialize();
    
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
        this.injector
      )
        .get<Renderable>(ConfiguredRenderable as any)
    ];

    this._isMinimized = Boolean(this._config.minimized);

    this.subscribe(MinimizeCommand, this._minimize.bind(this));
    this.subscribe(MakeVisibleCommand, this.makeVisible.bind(this));
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

  getMinimizedSize(): number {
    const item = this._contentItems[0];

    if (item) {
      return item.getMinimizedSize();
    }

    return 0;
  }

  makeVisible(command: MakeVisibleCommand<Renderable>): void {
    if (this.isMinimized) {
      this.emit(new MinimizeCommand(this, { minimize: false }));
    }
  }

  private _minimize(e: MinimizeCommand<Renderable>): void {
    const minimize = e.minimize == null ? !this._isMinimized : e.minimize;
    let size: number|null = null;
    const lastSize = (this._lastSize != null ? this._lastSize : this._config.initialSize) || null;
    
    e.stopPropagation();
    
    if (minimize && !this._isMinimized) {
      size = e.size;
      this._lastSize = this.size;
      this._isMinimized = true;
    } else if (!minimize && this._isMinimized && lastSize != null) {
      size = lastSize;
      this._isMinimized = false;
      this._lastSize = null;
    }

    if (size != null) {
      this._container.setSizeOf(this, size);
    }
  }

  static configure(config: XYItemContainerConfig): ConfiguredRenderable<XYItemContainer> {
    return new ConfiguredRenderable(XYItemContainer, config);
  }
}