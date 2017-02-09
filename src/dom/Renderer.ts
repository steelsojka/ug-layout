import { VNode } from 'snabbdom/vnode';
import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';

import { Subject, Observable } from '../events';
import { Deferred } from '../utils';

export class Renderer {
  rendered: Observable<void>;
  
  private _rendered: Subject<void> = new Subject<void>();
  private _patch: (oldVNode: VNode|Node, newVNode: VNode) => VNode = snabbdom.init([
    DOMClass,
    DOMStyle,
    DOMProps,
    DOMEvents
  ]);

  constructor() {
    this.rendered = this._rendered.asObservable();
  }

  destroy() {
    this._rendered.complete();
  }

  patch(oldVNode: VNode|Node, newVNode: VNode): VNode {
    return this._patch(oldVNode, newVNode);
  }

  render(): void {
    this._rendered.next();
  }
}