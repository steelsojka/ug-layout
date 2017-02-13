import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, Optional, Injectable } from './di';
import { 
  Renderable, 
  RenderableInjector,
  ConfiguredRenderable,
  RenderableArea
} from './dom';
import { 
  ContainerRef, 
  ConfigurationRef,
  RenderableConfig,
  RenderableArg
} from './common';
import { XYContainer } from './XYContainer';
import { DragHost } from './DragHost';

export interface LayoutConfig {
  child: RenderableArg<Renderable>;
}

@Injectable({
  providers: [ DragHost ]
})
export class Layout extends Renderable {
  private _child: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: LayoutConfig|null,
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(DragHost) protected _dragHost: DragHost
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

    this._dragHost.start.subscribe(this._onDragHostStart.bind(this));
  }  

  get height(): number {
    return this._container.height;
  }

  get width(): number {
    return this._container.width;
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

  getChildren(): Renderable[] {
    return [ this._child ];
  }

  getItemVisibleAreas(): Array<{ item: Renderable, area: RenderableArea }> {
    return this.getDescendants()
      .filter(item => item.isVisible())
      .map(item => {
        return {
          item,
          area: item.getArea()
        };
      });
  }

  private _onDragHostStart(item: Renderable): void {
    this._dragHost.setDropAreas(
      this.getItemVisibleAreas().filter(({ item }) => item.isDroppable())
    );
  }

  static configure(config: LayoutConfig): ConfiguredRenderable<Layout> {
    return new ConfiguredRenderable(Layout, config);    
  }
}