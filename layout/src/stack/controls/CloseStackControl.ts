import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../../di';
import { ContainerRef } from '../../common';
import { StackControl } from './StackControl';
import { StackHeader } from '../StackHeader';
import { Stack } from '../Stack';
import { StackItemContainer } from '../StackItemContainer';

export class CloseStackControl extends StackControl {
  get width(): number {
    return this.container.width;
  }

  get height(): number {
    return this.container.height;
  }
  
  render(): VNode {
    return h('div.ug-layout__close-stack-control', {
      attrs: {
        title: 'Close stack'  
      },
      style: {
        width: this.container.isHorizontal ? undefined : `${this.width}px`,
        height: this.container.isHorizontal ? `${this.height}px` : undefined
      }
    }, [
      h('div.ug-icon-close', {
        on: {
          click: e => this._onClick(e)
        }  
      })
    ]);
  }

  isActive(): boolean {
    const stack = this.container.container as Stack|null;

    if (stack) {
      return stack.isCloseable;
    }

    return true;
  }

  private _onClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();
    
    const stack = this.container.container as Stack|null;
    
    if (stack) {
      stack.close();
    }
  }
}