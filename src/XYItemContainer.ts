import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Renderer, Renderable, RenderableInjector, ConfiguredRenderable } from './dom';
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
  minSize?: number;
  maxSize?: number;
  fixed?: boolean;
}

export class XYItemContainer extends Renderable {
  ratio: number|typeof UNALLOCATED = UNALLOCATED;
  
  protected _height: number = 0;
  protected _width: number = 0;
  protected _container: XYContainer;
  
  private _item: Renderable;
  private _lastSize: number|null = null;
  private _isMinimized: boolean = false;

  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: XYItemContainerConfig,
    @Inject(ContainerRef) _container: XYContainer,
    @Inject(Renderer) private _renderer: Renderer
  ) {
    super(_container);
    
    if (this._config) {
      this.ratio = isNumber(this._config.ratio) ? this._config.ratio : UNALLOCATED;
    }

    this._item = RenderableInjector.fromRenderable(
      this._config.use, 
      [
        { provide: XYItemContainer, useValue: this },
        { provide: ContainerRef, useValue: this }
      ], 
      this._injector
    )
      .get(ConfiguredRenderable);

    this._item.destroyed.subscribe(this._onItemDestroy.bind(this));
    this.subscribe(MinimizeCommand, this._minimize.bind(this));
  }

  get size(): number {
    return this._container.isRow ? this.width : this.height;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  get minSize(): number {
    return isNumber(this._config.minSize) ? this._config.minSize : 50;
  }

  get maxSize(): number {
    return isNumber(this._config.maxSize) ? this._config.maxSize : Number.MAX_SAFE_INTEGER;
  }

  get fixed(): boolean {
    return Boolean(this._config.fixed);
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

  destroy(): void {
    this._item.destroy();
    super.destroy();
  }

  getChildren(): Renderable[] {
    return [ this._item ];
  }

  isVisible(): boolean {
    return !this._isMinimized && this._container.isVisible();
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

  private _onItemDestroy(): void {
    this._container.removeChild(this);
  }
}