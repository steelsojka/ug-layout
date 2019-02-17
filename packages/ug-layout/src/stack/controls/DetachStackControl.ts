import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { StackControl } from './StackControl';
import { Stack } from '../Stack';
import { StackItemContainer } from '../StackItemContainer';

export class DetachStackControl extends StackControl {
  get width(): number {
    return this.container.width;
  }

  get height(): number {
    return this.container.height;
  }

  render(): VNode {
    const styles: { [key: string]: string } = {};

    if (this.container.isHorizontal) {
      styles.height = `${this.height}px`;
    } else {
      styles.width = `${this.width}px`;
    }

    return h('div.ug-layout__detach-stack-control', {
      attrs: {
        title: 'Detach stack item'
      },
      style: styles
    }, [
      h('div.ug-icon-new-tab', {
        on: {
          click: e => this._onClick(e)
        }
      })
    ]);
  }

  getActiveItem(): StackItemContainer | null {
    const stack = this.container.container as Stack | null;

    return stack
      ? stack.getAtIndex(stack.activeIndex) as StackItemContainer | null
      : null;
  }

  isActive(): boolean {
    const item = this.getActiveItem();

    return item ? item.isDetachable : false;
  }

  private _onClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();

    const item = this.getActiveItem();

    if (item) {
      item.detach();
    }
  }
}