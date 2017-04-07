import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, Injector, Inject, Optional, forwardRef, ProviderArg } from './di';
import { RootInjector } from './RootInjector';
import { Layout } from './layout';
import { Serialized } from './serialization';
import { ViewManager } from './view';
import { defaults } from './utils';
import { DestroyContextEvent } from './events';
import { Renderer, Renderable, ConfiguredRenderable, RenderableInjector } from './dom';
import { 
  ConfigurationRef,
  ContainerRef, 
  RootConfigRef,
  RenderableArg,
  ElementRef,
  DestroyContext
} from './common';
import { UgPlugin } from './UgPlugin';

export interface RootLayoutConfig {
  use: RenderableArg<Layout>;
}

export interface RootLayoutCreationConfig {
  container: HTMLElement;
  plugins: UgPlugin[];
  providers: ProviderArg[];
}

export interface RootLayoutCreationConfigArgs {
  container: HTMLElement;
  plugins?: UgPlugin[];
  providers?: ProviderArg[];
  interceptors?: ProviderArg[];
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
    @Inject(ViewManager) protected _viewManager: ViewManager,
    @Inject(RootConfigRef) protected _rootConfig: RootLayoutCreationConfig
  ) {
    super();
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

  initialize(): void {
    this._renderer.initialize(this._containerEl);
    this._renderer.useNodeGenerator(() => this.render());
    this._isInitialized = true;

    for (const plugin of this._rootConfig.plugins) {
      plugin.initialize(this);
    }
  }

  load(config: ConfiguredRenderable<RootLayout>|RootLayoutConfig): void {
    this.emitDown(new DestroyContextEvent(DestroyContext.LOAD));
    this._contentItems.forEach(item => item.destroy());
    
    this._config = ConfiguredRenderable.resolveConfiguration(config);

    this._contentItems = [ this.createChild(this._config.use) ];
    
    this.resize();
    this.update();
  }

  setContainingNode(node: Node): void {
    this._renderer.setContainer(node);
    this._containerEl = node as HTMLElement;
  }

  detach(): void {
    this._renderer.detach();
  }

  destroy(): void {
    super.destroy();
    
    this._viewManager.destroy();
    this._renderer.destroy();
  }

  isVisible(): boolean {
    return true;
  }

  getPlugins<T extends UgPlugin>(type?: Type<T>): T[] {
    return this._rootConfig.plugins.filter(plugin => {
      return type ? plugin instanceof type : true;
    }) as T[];
  }

  static create<T extends RootLayout>(config: RootLayoutCreationConfigArgs): T {
    const _config = defaults(config, {
      plugins: [],
      providers: [] 
    }) as RootLayoutCreationConfig;
    
    const rootInjector = new RootInjector([
      { provide: ElementRef, useValue: config.container },
      { provide: RootConfigRef, useValue: config },
      ..._config.providers
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