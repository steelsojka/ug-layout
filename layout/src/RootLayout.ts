import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Injector, Inject, Optional, forwardRef, ProviderArg } from './di';
import { RootInjector } from './RootInjector';
import { Layout } from './Layout';
import { Serialized } from './serialization';
import { Renderer, Renderable, ConfiguredRenderable, RenderableInjector } from './dom';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RootConfigRef,
  RenderableConfig,
  RenderableArg,
  ElementRef
} from './common';

export interface RootLayoutConfig {
  use: RenderableArg<Layout>;
}

export interface RootLayoutCreationConfig {
  container: HTMLElement;
  providers?: ProviderArg[];
}

export class RootLayout extends Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _vnode: VNode;
  protected _isInitialized: boolean = false;
  protected _lastVNode: VNode|null = null;
  protected _offsetX: number = 0;
  protected _offsetY: number = 0;
  
  constructor(
    @Inject(ConfigurationRef) protected _config: RootLayoutConfig,
    @Inject(Renderer) protected _renderer: Renderer,
    @Inject(ElementRef) protected _containerEl: HTMLElement,
    @Inject(Injector) _injector: Injector
  ) {
    super(_injector);
  }

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }
  
  get isInitialized(): boolean {
    return this._isInitialized;
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
    this._isInitialized = true;

    return this;
  }

  load(config: ConfiguredRenderable<RootLayout>|RootLayoutConfig): void {
    this._contentItems.forEach(item => item.destroy());
    
    this._config = ConfiguredRenderable.resolveConfiguration(config);

    const injector = RenderableInjector.fromRenderable(this._config.use, [
      { provide: ContainerRef, useValue: this }
    ], this._injector);

    this._contentItems = [ injector.get(ConfiguredRenderable) ];
    
    this.resize();
    this._renderer.render();
  }

  destroy(): void {
    this._renderer.destroy();
    super.destroy();
  }

  isVisible(): boolean {
    return true;
  }

  static create<T extends RootLayout>(config: RootLayoutCreationConfig): T {
    const rootInjector = new RootInjector([
      { provide: ElementRef, useValue: config.container },
      { provide: RootConfigRef, useValue: config },
      ...config.providers ? config.providers : []
    ]);

    return RenderableInjector.fromRenderable(
      RootLayout, 
      [
        { provide: RootLayout, useExisting: ConfiguredRenderable }
      ], 
      rootInjector
    )
      .get(ConfiguredRenderable);
  }

  static configure(config: RootLayoutConfig): ConfiguredRenderable<RootLayout> {
    return new ConfiguredRenderable(RootLayout, config);
  }
}