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
  RenderableConfig,
  RenderableArg
} from './common';
import { XYItemContainer } from './XYItemContainer';
import { Splitter } from './Splitter';

export interface XYContainerConfig {
  children: RenderableArg<Renderable>[];
}

export class XYContainer implements Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;
  protected _children: XYItemContainer[] = [];
  protected _splitters: Splitter[] = [];

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
        { provide: ConfigurationRef, useValue: { use: config } },
        XYItemContainer
      ]);

      const item = injector.get(XYItemContainer) as XYItemContainer;

      item.dimension = 100 / children.length;

      return item;
    });

    for (let i = 0; i < this._children.length - 1; i++) {
      const injector = this._injector.spawn([
        { provide: ContainerRef, useValue: this },
        Splitter
      ]);
      
      this._splitters.push(injector.get(Splitter));
    }
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

  protected get _totalSplitterSize(): number {
    return this._splitters.reduce((result, splitter) => result + splitter.size, 0);
  }
  
  render(): VNode {
    const children: VNode[] = [];

    for (const [ index, child ] of this._children.entries()) {
      if (index > 0) {
        children.push(this._splitters[index - 1].render());
      }
      
      children.push(child.render());
    }
    
    return h(`div.${this._className}`, {
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, children);
  }

  updateChildSize(child: XYItemContainer, newDimension: number): void {
              
  }

  resize(): void {
    this._height = this._container.height;
    this._width = this._container.width;
  }
}