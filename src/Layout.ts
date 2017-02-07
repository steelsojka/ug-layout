import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, Optional, Injectable } from './di';
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
  RenderableArg
} from './common';
import { XYContainer } from './XYContainer';
import { DragHandler } from './DragHandler';

export interface LayoutConfig {
  child: RenderableArg<Renderable>;
}

@Injectable({
  providers: [ DragHandler ]
})
export class Layout extends Renderable {
  private _child: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: LayoutConfig|null,
    @Inject(ContainerRef) protected _container: Renderable
  ) {
    super(_container);
    
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
    return this._container.height;
  }

  get width(): number {
    return this._container.width;
  }

  resize(): void {
    this._child.resize();
  }

  render(): VNode {
    return h('div.ug-layout__layout', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, [
      this._child.render()
    ]);
  }

  destroy(): void {
    this._child.destroy();
    super.destroy();
  }

  isVisible(): boolean {
    return this._container.isVisible();
  }

  static configure(config: LayoutConfig): ConfiguredRenderable<Layout> {
    return new ConfiguredRenderable(Layout, config);    
  }
}