import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, ProviderArg, Inject, Injector, Optional, forwardRef } from '../di';
import { Renderer, Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef, ElementRef, DocumentRef } from '../common';
import { Stack } from '../stack';
import { ViewContainer } from './ViewContainer';
import { ViewConfig, ResolverStrategy } from './common';
import { Subject, Observable, BeforeDestroyEvent } from '../events';
import { MakeVisibleCommand, MinimizeCommand } from '../commands';
import { ViewManager } from './ViewManager';
import { ViewFactory } from './ViewFactory';
import { get } from '../utils';

export class View extends Renderable {
  visibilityChanges: Observable<boolean>;
  sizeChanges: Observable<{ width: number, height: number }>;
  
  protected _viewContainer: ViewContainer<any>;
  protected _visibilityChanges: Subject<boolean> = new Subject();
  protected _sizeChanges: Subject<{ width: number, height: number }> = new Subject();
  
  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(ConfigurationRef) protected _configuration: ViewConfig,
    @Inject(ViewManager) protected _viewManager: ViewManager,
    @Inject(ViewFactory) protected _viewFactory: ViewFactory,
    @Inject(DocumentRef) protected _document: Document
  ) {
    super();
    
    this.visibilityChanges = this._visibilityChanges.asObservable().distinctUntilChanged();
    this.sizeChanges = this._sizeChanges.asObservable().distinctUntilChanged((p, c) => {
      return p.width === c.width && p.height === c.height;
    });
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  get lazy(): boolean|null {
    return this.resolveConfigProperty<boolean>('lazy');
  }
  
  get isCacheable(): boolean|null {
    return this.resolveConfigProperty<boolean>('cacheable');
  }
  
  get ref(): string|null {
    return this.resolveConfigProperty<string>('ref');
  }
  
  get resolution(): ResolverStrategy|null {
    return this.resolveConfigProperty<ResolverStrategy>('resolution');
  }
  
  get token(): any|null {
    return this._viewFactory.getTokenFrom(this._configuration);
  }

  initialize(): void {
    super.initialize();
    
    this._renderer.rendered
      .takeUntil(this.destroyed)
      .subscribe(this._postRender.bind(this));
  }

  render(): VNode {
    return h('div.ug-layout__view-container', {
      key: this.uid,
      style: {
        width: `${this.width}px`,
        height: `${this.height}px`
      },
      hook: {
        create: (oldNode, newNode) => this._onCreate(newNode.elm as HTMLElement)
      }
    });
  }

  destroy(): void {
    this._sizeChanges.complete();
    this._visibilityChanges.complete();

    super.destroy();
  }

  close(args: { silent?: boolean } = {}): void {
    const { silent = false } = args;
    
    if (!silent) {
      const event = new BeforeDestroyEvent(this);
      
      this._eventBus.next(event);
      event.results().subscribe(() => this.remove());
    } else {
      this.destroy();
    }
  }

  makeVisible(): void {
    this.emitUp(new MakeVisibleCommand(this));
  }

  minimize(): void {
    this.emitUp(new MinimizeCommand(this));
  }

  resolveConfigProperty<T>(path: string): T|null {
    return this._viewFactory.resolveConfigProperty<T>(this._configuration, path);
  }

  private _postRender(): void {
    this._visibilityChanges.next(this.isVisible());
    this._sizeChanges.next({ width: this.width, height: this.height });
  }

  private _onCreate(element: HTMLElement): void {
    if (!this._viewContainer) {
      this._viewContainer = this._viewManager.resolveOrCreate<any>({
        config: this._configuration,
        injector: this.injector,
        container: this
      });
    }

    this._viewContainer.setView(this);
    this._viewContainer.mountTo(element);
  }

  static configure(config: ViewConfig): ConfiguredRenderable<View> {
    return new ConfiguredRenderable(View, config);
  }
}