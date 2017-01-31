import { VNode } from 'snabbdom/vnode';
import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';

export class DOMRenderer {
  private _patch: (oldVNode: VNode|Node, newVNode: VNode) => VNode = snabbdom.init([
    DOMClass,
    DOMClass,
    DOMProps  
  ]);
  
  update(oldVNode: VNode|Node, newVNode: VNode): VNode {
    return this._patch(oldVNode, newVNode);
  }

  cloneNode(node: VNode): VNode {
    return Object.assign({}, node);
  }
}