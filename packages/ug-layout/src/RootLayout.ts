import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, Inject, ProviderArg, PostConstruct } from './di';
import { RootInjector } from './RootInjector';
import { Layout } from './layout';
import { ViewManager } from './view';
import { defaults } from './utils';
import { Renderer, Renderable, ConfiguredRenderable, RenderableInjector, RenderableConfig } from './dom';
import {
  ConfigurationRef,
  RootConfigRef,
  RenderableArg,
  ElementRef,
  ContextType,
  WindowRef
} from './common';
import { UgPlugin } from './UgPlugin';
import { LockState, LOCK_DRAGGING, LOCK_RESIZING } from './LockState';

export interface RootLayoutConfig extends RenderableConfig {
  use: RenderableArg<Layout>;
}

export interface RootLayoutCreationConfig {
  container: HTMLElement;
  plugins: UgPlugin[];
  providers: ProviderArg[];
  getContainerDimensions: (() => { x: number; y: number; width: number; height: number }) | null;
}

export interface RootLayoutCreationConfigArgs {
  container?: HTMLElement;
  plugins?: UgPlugin[];
  providers?: ProviderArg[];
  interceptors?: ProviderArg[];
  detachUrl?: string;
  getContainerDimensions?: (() => { x: number; y: number; width: number; height: number }) | null;
}

export class RootLayout extends Renderable<RootLayoutConfig> {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _vnode: VNode;
  protected _isInitialized: boolean = false;
  protected _lastVNode: VNode|null = null;
  protected _offsetX: number = 0;
  protected _offsetY: number = 0;

  @Inject(ConfigurationRef) protected _config: RootLayoutConfig;
  @Inject(Renderer) protected _renderer: Renderer;
  @Inject(ElementRef) protected _containerEl: HTMLElement;
  @Inject(ViewManager) protected _viewManager: ViewManager;
  @Inject(RootConfigRef) protected _rootConfig: RootLayoutCreationConfig;
  @Inject(LockState) protected _lockState: LockState;
  @Inject(WindowRef) protected _window: Window;

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

  get lockState(): LockState {
    return this._lockState;
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
    }, this._contentItems.map(item => item.render()));
  }

  resize(dimensionsOrNone?: { height: number, width: number, x: number, y: number }): void {
    const dimensions = dimensionsOrNone 
      ? dimensionsOrNone 
      : this._rootConfig.getContainerDimensions 
        ? this._rootConfig.getContainerDimensions() 
        : null;

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

    this._contentItems.forEach(item => item.resize());
  }

  update(): void {
    this._renderer.render();
  }

  @PostConstruct()
  initialize(): void {
    this._lockState.set(LOCK_DRAGGING, false);
    this._lockState.set(LOCK_RESIZING, false);

    this._renderer.setContainer(this._containerEl);
    this._renderer.useNodeGenerator(() => this.render());
    this._isInitialized = true;

    for (const plugin of this._rootConfig.plugins) {
      if (plugin.initialize) {
        plugin.initialize(this);
      }
    }
  }

  load(config: ConfiguredRenderable<RootLayout>|RootLayoutConfig, options: { context?: ContextType } = {}): void {
    const { context = ContextType.LOAD } = options;

    this.reset(context);
    this._config = ConfiguredRenderable.resolveConfiguration(config);
    this._contentItems = [ this.createChild(this._config.use) ];

    this.resize();
    this.update();
  }

  reset(context: ContextType = ContextType.NONE): void {
    this._contentItems.forEach(item => item.destroy({ type: context }));
    this._contentItems = [];
    this._viewManager.purgeCached(context);
  }

  setContainingNode(node: Node): void {
    this._renderer.setContainer(node);
    this._containerEl = node as HTMLElement;
  }

  detach(): void {
    this._renderer.detach();
  }

  destroy(): void {
    super.destroy({ type: ContextType.NONE });

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

  getActiveWindow(): Window | null {
    return this._window;
  }

  static create<T extends RootLayout>(config: RootLayoutCreationConfigArgs = {}): T {
    const _config = defaults(config, {
      plugins: [],
      providers: [],
      getContainerDimensions: null
    }) as RootLayoutCreationConfig;

    const providers = _config.plugins.reduce((result, plugin) => {
      if (plugin.configureProviders) {
        return plugin.configureProviders(result);
      }

      return result;
    }, [
      { provide: ElementRef, useValue: config.container },
      { provide: RootConfigRef, useValue: config },
      ..._config.providers
    ]);

    const rootInjector = new RootInjector(providers);

    return RenderableInjector.fromRenderable(
      RootLayout,
      [
        { provide: RootLayout, useExisting: ConfiguredRenderable }
      ],
      rootInjector
    )
      .get<T>(ConfiguredRenderable as any);
  }

  static configure(config: RootLayoutConfig): ConfiguredRenderable<RootLayout> {
    return new ConfiguredRenderable(RootLayout, config);
  }
}