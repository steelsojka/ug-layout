import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, Optional } from './di';
import { 
  Renderable, 
  RenderableInjector,
  ConfiguredRenderable
} from './dom';
import { 
  ParentLayoutRef, 
  ContainerRef, 
  ConfigurationRef,
  RenderableConfig,
  Type
} from './common';
import { XYContainer } from './XYContainer';

export interface LayoutConfig {
  child: Type<XYContainer>|ConfiguredRenderable<XYContainer>;
}

export class Layout implements Renderable {
  private _height: number = 0;
  private _width: number = 0;
  private _child: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ContainerRef) private _container: Renderable,
    @Inject(ConfigurationRef) private _config: LayoutConfig|null
  ) {
    if (!this._config || !this._config.child) {
      throw new Error('A layout requires a child renderable.');
    }

    const config = this._config.child;
    const injector = RenderableInjector.fromRenderable(config, [
      { provide: ContainerRef, useValue: this },
    ], this._injector);

    this._child = injector.get(ConfiguredRenderable);
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

  static configure(config: LayoutConfig): ConfiguredRenderable<Layout> {
    return new ConfiguredRenderable(Layout, config);    
  }
}