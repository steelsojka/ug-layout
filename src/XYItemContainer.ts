import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Renderable, RenderableInjector, ConfiguredRenderable } from './dom';
import { Type, ConfigurationRef, ContainerRef, XYDirection } from './common';
import { XYContainer } from './XYContainer';

console.log(XYContainer)

export interface XYItemContainerConfig {
  use: Type<Renderable>|ConfiguredRenderable<Renderable>;
}

export class XYItemContainer implements Renderable {
  dimension: number = 0;
  
  private _height: number = 0;
  private _width: number = 0;
  private _item: Renderable;

  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ContainerRef) private _container: XYContainer,
    @Inject(ConfigurationRef) private _config: XYItemContainerConfig
  ) {
    const injector = RenderableInjector.fromRenderable(this._config.use, [
      { provide: XYItemContainer, useValue: this },
      { provide: ContainerRef, useValue: this }
    ], this._injector);

    this._item = injector.get(ConfiguredRenderable);
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
  
  resize(dimensions: { width: number, height: number }): void {
    if (this._container.direction === XYDirection.X) {
      this._height = this._container.height;
      this._width = dimensions.width;
    } else {
      this._width = this._container.width;
      this._height = dimensions.height;
    }

    this._item.resize();
  }  
}