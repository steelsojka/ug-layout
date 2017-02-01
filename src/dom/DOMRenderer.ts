import { VNode } from 'snabbdom/vnode';
import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';

import { Deferred } from '../utils';

export class DOMRenderer {
  private _patch: (oldVNode: VNode|Node, newVNode: VNode) => VNode = snabbdom.init([
    DOMClass,
    DOMStyle,
    DOMProps  
  ]);

  private _queue: Array<{ old: VNode|Node, new: VNode, deferred: Deferred<VNode> }> = [];
  private _isQueued: boolean = false;

  queueUpdate(oldVNode: VNode|Node, newVNode: VNode): Promise<VNode> {
    const deferred = new Deferred<VNode>();

    this._queue.push({ old: oldVNode, new: newVNode, deferred });

    if (!this._isQueued) {
      Promise.resolve().then(() => {
        this.flush();
        this._isQueued = false;
      });

      this._isQueued = true;
    }

    return deferred.promise;
  }
  
  update(oldVNode: VNode|Node, newVNode: VNode): VNode {
    return this._patch(oldVNode, newVNode);
  }

  flush(): void {
    while (this._queue.length) {
      const queued = this._queue.shift();

      if (queued) {
        queued.deferred.resolve(this.update(queued.old, queued.new));
      }
    }
  }

  cloneNode(node: VNode): VNode {
    return Object.assign({}, node);
  }
}