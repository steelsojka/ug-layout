import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';

import { Injector, forwardRef } from './di';
import { RootInjector } from './RootInjector';
import { LayoutInstance } from './LayoutInstance';
import { Node } from './common';

export interface RootLayoutConfig {
  container?: Node,
  injector?: Injector
}

export class RootLayout {
  private _injector: Injector;
  private _container: Node|null;
  private _vnode: VNode;
  private _layout: LayoutInstance;
  private _isAttached: boolean = false;
  private _patch: Function = snabbdom.init([
    DOMClass  
  ]);
  private _lastVNode: VNode|null = null;
  
  constructor(config: RootLayoutConfig = {}) {
    this._injector = config.injector || new RootInjector();
    this._container = config.container || null;
    this._vnode = h('div.ug-layout__root');
  }

  get isAttached(): boolean {
    return this._isAttached;
  }
  
  get container(): Node|null {
    return this._container;
  }

  initialize(): void {
    const layoutInjector = this._injector.spawn([
      LayoutInstance,
      { provide: Injector, useValue: forwardRef(() => layoutInjector) },
      { provide: Node, useValue: this._vnode }
    ]);

    this._layout = layoutInjector.get(LayoutInstance);

    if (this._container) {
      this.attach(this._container);
    }
  }

  attach(node?: Node): void {
    if (this._isAttached) {
      throw new Error(`Layout is already attached to DOM`);
    }
    
    if (node && node !== this._container) {
      this._container = node;
    }

    this._lastVNode = this._patch(this._container, this._vnode);
    this._isAttached = true;
  }

  render(): void {
    this._lastVNode = this._patch(this._lastVNode, this._vnode);
  }
}