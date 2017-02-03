import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Renderable, RenderableInjector, ConfiguredRenderable } from './dom';
import { 
  Type, 
  ConfigurationRef, 
  ContainerRef, 
  XYDirection, 
  UNALLOCATED,
  RenderableArg  
} from './common';
import { isNumber } from './utils';
import { XYContainer } from './XYContainer';

export interface XYItemContainerConfig {
  use: RenderableArg<Renderable>;
  ratio?: number;
}

export class XYItemContainer extends Renderable {
  ratio: number|typeof UNALLOCATED = UNALLOCATED;
  
  protected _height: number = 0;
  protected _width: number = 0;
  
  private _item: Renderable;

  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ContainerRef) private _container: XYContainer,
    @Inject(ConfigurationRef) private _config: XYItemContainerConfig
  ) {
    super();
    
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
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._height;
  }

  render(): VNode {
    return h('div.ug-layout__xy-item-container', {
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
  
  resize(): void {
    this._item.resize();
  }  

  destroy(): void {
    this._item.destroy();
    super.destroy();
  }
}