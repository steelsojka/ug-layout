import { VNode } from 'snabbdom/vnode';

export function appendChild(vnode: VNode, childNode: VNode): void {
  if (!vnode.children) {
    vnode.children = [];
  }

  vnode.children.push(childNode);
}