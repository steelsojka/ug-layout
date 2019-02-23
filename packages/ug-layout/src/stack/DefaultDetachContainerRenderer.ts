import { VNode } from 'snabbdom/vnode';
import { h } from 'snabbdom/h';

import { DetachContainerRenderer } from './DetachContainerRenderer';
import { StackItemContainer } from './StackItemContainer';

export class DefaultDetachContainerRenderer extends DetachContainerRenderer {
  render(item: StackItemContainer): VNode {
    return h('div.ug-layout__default-detach-container', {
      style: {
        height: `${item.height}px`,
        width: `${item.width}px`
      }
    });
  }
}