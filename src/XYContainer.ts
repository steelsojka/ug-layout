import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { 
  Renderable, 
  RenderableInjector,
  ConfiguredRenderable
} from './dom';
import { Inject, Injector } from './di';
import { 
  ContainerRef, 
  XYDirectionRef, 
  XYDirection,
  ConfigurationRef,
  RenderableConfig
} from './common';
import { XYItemContainer } from './XYItemContainer';

export interface XYContainerConfig {
  children: RenderableConfig<Renderable>[];
}

export class XYContainer implements Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;
  protected _children: XYItemContainer[] = [];

  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(ConfigurationRef) protected _config: XYContainerConfig|null,
    @Inject(Injector) protected _injector: Injector
  ) {
    const children = this._config && this._config.children ? this._config.children : [];
    
    this._children = children.map<XYItemContainer>(config => {
      const injector = this._injector.spawn([
        { provide: ContainerRef, useValue: this },
        { provide: XYContainer, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        XYItemContainer
      ]);

      const item = injector.get(XYItemContainer) as XYItemContainer;

      item.dimension = 100 / children.length;

      return item;
    });
  }

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }

  get direction(): XYDirection {
    return this._direction;
  }
  
  render(): VNode {
    return h(`div.${this._className}`, {
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, this._children.map(child => child.render()));
  }

  resize(): void {
    this._height = this._container.height;
    this._width = this._container.width;

    for (const child of this._children) {
      let height = this._height;
      let width = this._width;
      
      if (this.direction === XYDirection.X) {
        child.resize({ height, width: width / (100 * child.dimension) });
      } else {
        child.resize({ height: height / (100 * child.dimension), width });
      }
    }
  }
}