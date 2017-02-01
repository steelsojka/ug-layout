import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Injector, Inject, Optional } from './di';
import { ParentLayoutRef, Element, Node } from './common';
import { appendChild } from './utils';

export class LayoutInstance {
  private _vnode: VNode = h('div.ug-layout__layout');
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ParentLayoutRef) @Optional() private _parent: LayoutInstance|null
  ) {}  

  get node(): VNode {
    return this._vnode;
  }
}