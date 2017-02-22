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
  RenderableArg,
  DropArea
} from './common';
import { XYContainer } from './XYContainer';
import { DragHost, DragHostContainer } from './DragHost';

export interface LayoutConfig {
  child: RenderableArg<Renderable>;
}

@Injectable({
  providers: [ DragHost ]
})
export class Layout extends Renderable {
  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) private _config: LayoutConfig|null,
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(DragHost) protected _dragHost: DragHost
  ) {
    super(_injector);
    
    if (!this._config || !this._config.child) {
      throw new Error('A layout requires a child renderable.');
    }

    const config = this._config.child;
    const injector = RenderableInjector.fromRenderable(config, [
      { provide: ContainerRef, useValue: this },
    ], this._injector);

    this._contentItems.push(injector.get(ConfiguredRenderable));

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
    }, 
      this._contentItems.map(i => i.render())
    );
  }

  destroy(): void {
    this._dragHost.destroy();
    super.destroy();
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

  private _onDragHostStart(container: DragHostContainer): void {
    const { offsetX, offsetY, height, width } = this;
    const { dragArea, item } = container;
    
    this._dragHost.bounds = new RenderableArea(offsetX, width + offsetX - dragArea.width, offsetY, height + offsetY - dragArea.height);
    this._dragHost.setDropAreas(this._getDropTargets(item));
  }

  private _getDropTargets(target: Renderable): DropArea[] {
    return this.getItemVisibleAreas()
      .filter(({ item }) => {
        return DragHost.isDropTarget(item) 
          && item !== target
          && item.isDroppable(target)
          && !target.contains(item)
          && !target.isContainedWithin(item);
      }) as any; 
  }

  static configure(config: LayoutConfig): ConfiguredRenderable<Layout> {
    return new ConfiguredRenderable(Layout, config);    
  }
}