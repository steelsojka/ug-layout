import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Injector, Inject, Optional, forwardRef, ProviderArg } from './di';
import { Plugin } from './plugins';
import { RootInjector } from './RootInjector';
import { Layout } from './Layout';
import { Renderer, Renderable, ConfiguredRenderable, RenderableInjector } from './dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RootConfigRef,
  RenderableConfig
} from './common';

export interface RootLayoutConfig<T> {
  use?: T;
  plugins?: Plugin[];
  container: HTMLElement;
  manualOffset?: boolean;
  providers?: ProviderArg[];
}

export interface RootConfiguration extends RenderableConfig<Layout> {}

export class RootLayout extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _containerEl: HTMLElement;
  protected _vnode: VNode;
  protected _isAttached: boolean = false;
  protected _lastVNode: VNode|null = null;
  protected _offsetX: number = 0;
  protected _offsetY: number = 0;
  
  constructor(
    @Inject(RootConfigRef) protected _config: RootLayoutConfig<RootLayout>,
    @Inject(Renderer) protected _renderer: Renderer,
    @Inject(Injector) _injector: Injector
  ) {
    super(_injector);
    
    this._containerEl = _config.container;
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
  
  get containerEl(): Node|null {
    return this._containerEl;
  }

  get offsetX(): number {
    return this._offsetX;
  }
  
  get offsetY(): number {
    return this._offsetY;
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
      this._contentItems[0].render()
    ]);
  }

  resize(dimensions?: { height: number, width: number, x: number, y: number }): void {
    if (dimensions) {
      this._width = dimensions.width;
      this._height = dimensions.height;
      this._offsetX = dimensions.x;
      this._offsetY = dimensions.y;
    } else {
      const clientRec = this._containerEl.getBoundingClientRect();
      
      this._width = clientRec.width;
      this._height = clientRec.height;
      this._offsetX = clientRec.left;
      this._offsetY = clientRec.top;
    }
    
    this._contentItems[0].resize();
  }

  update(): void {
    this._renderer.render();
  }

  initialize(): this {
    this._renderer.initialize(this._containerEl);
    this._renderer.useNodeGenerator(() => this.render());
    this.resize();
    this._renderer.render();

    return this;
  }

  configure(config: RootConfiguration): this {
    const injector = RenderableInjector.fromRenderable(config.use, [
      { provide: ContainerRef, useValue: this },
      { provide: Layout, useExisting: ConfiguredRenderable }
    ], this._injector);

    this._contentItems = [ injector.get(ConfiguredRenderable) ];

    return this;
  }

  isVisible(): boolean {
    return true;
  }

  static create<T extends RootLayout>(config: RootLayoutConfig<T>): T {
    const injector = new RootInjector([
      { provide: RootLayout, useClass: config.use ? config.use : RootLayout },
      { provide: RootConfigRef, useValue: config },
      { provide: Injector, useValue: forwardRef(() => injector) },
      ...config.providers ? config.providers : []
    ]);

    return injector.get(RootLayout);
  }
}