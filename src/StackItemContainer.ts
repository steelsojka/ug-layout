import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Renderable, RenderableInjector, ConfiguredRenderable } from './dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RenderableArg  
} from './common';
import { Stack } from './Stack';

export interface StackItemContainerConfig {
  use: RenderableArg<Renderable>;
  title?: string;
}

export class StackItemContainer extends Renderable {
  private _item: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackItemContainerConfig,
    @Inject(ContainerRef) protected _container: Stack
  ) {
    super(_container);
    
    this._item = RenderableInjector.fromRenderable(
      this._config.use, 
      [
        { provide: StackItemContainer, useValue: this },
        { provide: ContainerRef, useValue: this }
      ],
      this._injector
    )
      .get(ConfiguredRenderable);
  }

  get width(): number {
    return this._container.isHorizontal 
      ? this._container.width 
      : this._container.width - this._container.header.width;
  }

  get height(): number {
    return this._container.isHorizontal 
      ? this._container.height - this._container.header.height 
      : this._container.height;
  }

  get isActive(): boolean {
    return this._container.isActiveContainer(this);
  }

  resize(): void {
    this._item.resize();
  }

  render(): VNode {
    return h('div.ug-layout__stack-item-container', {
      props: {
        hidden: !this.isActive
      },
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, [ this._item.render() ]);
  }

  destroy(): void {
    this._item.destroy();
    super.destroy();
  }

  isVisible(): boolean {
    return this._container.isVisible() && this._container.isActiveContainer(this);
  }
}