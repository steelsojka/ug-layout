import { VNode } from 'snabbdom/vnode';

import { StackItemContainer } from './StackItemContainer';

export abstract class DetachContainerRenderer {
  abstract render(item: StackItemContainer): VNode;
}