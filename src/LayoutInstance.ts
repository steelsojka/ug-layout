import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, Optional } from './di';
import { Renderable, DOMRenderer } from './dom';
import { 
  ParentLayoutRef, 
  ContainerRef, 
  ConfigurationRef,
  RenderableConfig
} from './common';

export interface LayoutConfig {
  child: RenderableConfig;
}

export class LayoutInstance implements Renderable {
  private _height: number = 0;
  private _width: number = 0;
  private _child: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(DOMRenderer) private _domRender: DOMRenderer,
    @Inject(ContainerRef) private _container: Renderable,
    @Inject(ConfigurationRef) private _config: LayoutConfig
  ) {
    if (!this._config.child) {
      throw new Error('A layout requires a child renderable.');
    }

    const config = this._config.child;
    const injector = this._injector.spawn([
      { provide: ConfigurationRef, useValue: this._config.child },
      { provide: ContainerRef, useValue: this },
      config.use
    ]);

    this._child = injector.get(config.use);
  }  

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }

  resize(): void {
    this._height = this._container.height;
    this._width = this._container.width;

    this._child.resize();
  }

  render(): VNode {
    return h('div.ug-layout__layout', {
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, [
      this._child.render()
    ]);
  }
}