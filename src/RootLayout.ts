import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Injector, Inject, Optional } from './di';
import { RootInjector } from './RootInjector';
import { LayoutInstance } from './LayoutInstance';
import { DOMRenderer, Renderable } from './dom';
import { ContainerRef, RootConfigRef } from './common';

export interface RootLayoutConfig {
  container: HTMLElement,
  injector?: Injector
}

export class RootLayout implements Renderable {
  private _container: HTMLElement;
  private _vnode: VNode;
  private _layout: LayoutInstance;
  private _isAttached: boolean = false;
  private _lastVNode: VNode|null = null;
  private _height: number = 0;
  private _width: number = 0;
  private _mountPoint: Node = document.createElement('div');
  
  constructor(
    @Inject(RootConfigRef) @Optional() config: RootLayoutConfig,
    @Inject(DOMRenderer) private _domRenderer: DOMRenderer,
    @Inject(Injector) private _injector: Injector
  ) {
    this._container = config.container;
  }

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }
  
  get isAttached(): boolean {
    return this._isAttached;
  }
  
  get container(): Node|null {
    return this._container;
  }

  render(): VNode {
    return h('div.ug-layout__root', {
      style: {
        width: `${this._width}px`,
        height: `${this._height}px`
      }
    }, [
      this._layout.render()
    ]);
  }

  resize(): void {
    const clientRec = this._container.getBoundingClientRect();

    this._width = clientRec.width;
    this._height = clientRec.height;
    
    this._layout.resize();
  }

  update(): void {
    this._lastVNode = this._domRenderer.update(this._lastVNode, this.render());
  }

  initialize(): void {
    const layoutInjector = this._injector.spawn([
      LayoutInstance,
      { provide: ContainerRef, useValue: this }
    ]);

    this._layout = layoutInjector.get(LayoutInstance);

    this.mount();
  }

  mount(): void {
    if (this._isAttached) {
      throw new Error(`Layout is already attached to DOM`);
    }

    this.attach();
    this.resize();
    this._lastVNode = this._domRenderer.update(this._mountPoint, this.render());
  }

  attach(): void {
    this._container.appendChild(this._mountPoint);
    this._isAttached = true;
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