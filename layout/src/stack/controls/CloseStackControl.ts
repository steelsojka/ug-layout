import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../../di';
import { ContainerRef } from '../../common';
import { StackControl } from './StackControl';
import { StackHeader } from '../StackHeader';
import { Stack } from '../Stack';
import { StackItemContainer } from '../StackItemContainer';

export class CloseStackControl extends StackControl {
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
    return h('div.ug-layout__close-stack-control', {
      attrs: {
        title: 'Close stack'  
      },
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

  isActive(): boolean {
    const stack = this._container.container as Stack|null;

    if (stack) {
      return stack.isCloseable;
    }

    return true;
  }

  private _onClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    
    const stack = this._container.container as Stack|null;
    
    if (stack) {
      stack.close();
    }
  }
}