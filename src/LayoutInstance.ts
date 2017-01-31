import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, forwardRef, Optional } from './di';
import { ParentLayoutRef, Element, Node } from './common';
import { appendChild } from './utils';

export class LayoutInstance {
  private _vnode: VNode = h('div', { class: 'ug-layout__layout' });
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ParentLayoutRef) @Optional() private _parent: LayoutInstance,
    @Inject(Node) @Optional() private _container: VNode|null
  ) {
    if (this._container) {
      appendChild(this._container, this._vnode);
    }  
  }  
}