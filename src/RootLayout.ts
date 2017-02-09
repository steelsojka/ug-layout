import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Injector, Inject, Optional } from './di';
import { RootInjector } from './RootInjector';
import { Layout } from './Layout';
import { Renderer, Renderable, ConfiguredRenderable, RenderableInjector } from './dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RootConfigRef,
  RenderableConfig
} from './common';

export interface RootLayoutConfig {
  container: HTMLElement,
  injector?: Injector
}

export interface RootConfiguration extends RenderableConfig<Layout> {}

export class RootLayout extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  private _containerEl: HTMLElement;
  private _vnode: VNode;
  private _layout: Layout;
  private _isAttached: boolean = false;
  private _lastVNode: VNode|null = null;
  private _mountPoint: Node = document.createElement('div');
  
  constructor(
    @Inject(RootConfigRef) @Optional() config: RootLayoutConfig,
    @Inject(Renderer) private _renderer: Renderer,
    @Inject(Injector) private _injector: Injector
  ) {
    super();
    
    this._containerEl = config.container;
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
    return this._containerEl;
  }

  makeVisible(): void {
    this._renderer.render();
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

  resize(dimensions?: { height: number, width: number }): void {
    if (dimensions) {
      this._width = dimensions.width;
      this._height = dimensions.height;
    } else {
      const clientRec = this._containerEl.getBoundingClientRect();
      
      this._width = clientRec.width;
      this._height = clientRec.height;
    }
    
    this._layout.resize();
  }

  update(): void {
    this._renderer.render();
  }

  initialize(): this {
    this.mount();

    return this;
  }

  mount(): void {
    if (this._isAttached) {
      throw new Error(`Layout is already attached to DOM`);
    }

    this.attach();
    this.resize();
    this._renderer.rendered.subscribe(this._onRender.bind(this));
    this._renderer.render();
  }

  attach(): void {
    this._containerEl.appendChild(this._mountPoint);
    this._isAttached = true;
  }

  configure(config: RootConfiguration): this {
    const injector = RenderableInjector.fromRenderable(config.use, [
      { provide: ContainerRef, useValue: this },
      { provide: Layout, useExisting: ConfiguredRenderable }
    ], this._injector);

    this._layout = injector.get(ConfiguredRenderable);

    return this;
  }

  isVisible(): boolean {
    return true;
  }

  getChildren(): Renderable[] {
    return [ this._layout ];
  }

  private _onRender(): void {
    const node = this._lastVNode ? this._lastVNode : this._mountPoint;
    
    this._lastVNode = this._renderer.patch(node, this.render());
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