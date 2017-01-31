import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

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
  
  constructor(config: RootLayoutConfig = {}) {
    this._injector = config.injector || new RootInjector();
    this._container = config.container || null;
    this._vnode = h('div', { class: 'ug-layout__root' });

    const layoutInjector = this._injector.spawn([
      LayoutInstance,
      { provide: Injector, useValue: forwardRef(() => layoutInjector) },
      { provide: Node, useValue: this._vnode }
    ]);

    this._layout = layoutInjector.get(LayoutInstance);
  }

  update(): void {
  }
}