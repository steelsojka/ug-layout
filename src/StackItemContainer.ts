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

export class StackItemContainer implements Renderable {
  private _item: Renderable;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ContainerRef) private _container: Stack,
    @Inject(ConfigurationRef) private _config: StackItemContainerConfig
  ) {
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

  resize(): void {
    this._item.resize();
  }

  render(): VNode {
    return h('div.ug-layout__stack-item-container', {
      props: {
        hidden: !this._container.isActiveContainer(this)
      },
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, [ this._item.render() ]);
  }
}