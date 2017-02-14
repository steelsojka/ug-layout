import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di';
import { ContainerRef } from '../common';
import { StackControl } from './StackControl';
import { StackHeader } from './StackHeader';
import { MinimizeCommand } from '../commands';

export class MinimizeStackControl extends StackControl {
  constructor(
    @Inject(ContainerRef) protected _container: StackHeader,
    @Inject(Injector) protected _injector: Injector
  ) {
    super(_injector);
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }
  
  render(): VNode {
    return h('div.ug-layout__stack-minimize-control', {
      style: {
        width: this._container.isHorizontal ? undefined : `${this.width}px`,
        height: this._container.isHorizontal ? `${this.height}px` : undefined
      }
    }, [
      h('div', {
        on: {
          click: e => this._onClick(e)
        }  
      }, 'x')
    ]);
  }

  private _onClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    
    this.emitUp(new MinimizeCommand(this, { size: this.height }))
  }
}