import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Injector, Inject, Optional } from './di';
import { RootInjector } from './RootInjector';
import { LayoutInstance } from './LayoutInstance';
import { DOMRenderer } from './DOMRenderer';
import { Node, RootConfigRef } from './common';

export interface RootLayoutConfig {
  container?: Node,
  injector?: Injector
}

export class RootLayout {
  private _container: Node|null;
  private _vnode: VNode;
  private _layout: LayoutInstance;
  private _isAttached: boolean = false;
  private _lastVNode: VNode|null = null;
  
  constructor(
    @Inject(RootConfigRef) @Optional() config: RootLayoutConfig,
    @Inject(DOMRenderer) private _domRenderer: DOMRenderer,
    @Inject(Injector) private _injector: Injector
  ) {
    if (!config) {
      config = {};
    }
    
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

    this._lastVNode = this._domRenderer.update(this._container, this._vnode);
    this._isAttached = true;
  }

  render(): void {
    this._lastVNode = this._domRenderer.update(this._lastVNode, this._vnode);
  }

  static create(config: RootLayoutConfig): RootLayout {
    const rootInjector = config.injector || new RootInjector();
    const injector = rootInjector.spawn([
      RootLayout,
      { provide: RootConfigRef, useValue: config }
    ]);

    return injector.get(RootLayout);
  }
}