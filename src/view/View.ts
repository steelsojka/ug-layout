import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject } from '../di';
import { Renderable } from '../dom';
import { ContainerRef } from '../common';

export class View implements Renderable {
  constructor(
    @Inject(ContainerRef) private _container: Renderable
  ) {}

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  render(): VNode {
    return h('div.ug-layout__view-container', {
      style: {
        width: `${this.width}px`,
        height: `${this.height}px`
      }
    });
  }

  resize() {}
}