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

export interface XYItemContainerConfig {
  use: RenderableArg<Renderable>;
  ratio?: number;
}

export class XYItemContainer extends Renderable {
  ratio: number|typeof UNALLOCATED = UNALLOCATED;
  
  protected _height: number = 0;
  protected _width: number = 0;
  protected _container: XYContainer;
  
  private _item: Renderable;

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

  private _minimize(e: MinimizeCommand<Renderable>): void {
    e.stopPropagation();
    
    this.ratio = e.size / this.size;
    this._container.resize();
    this._renderer.render();
  }

  private _onItemDestroy(): void {
    this._container.removeChild(this);
  }
}