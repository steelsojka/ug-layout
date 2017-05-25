import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import { CompleteOn } from 'rx-decorators/completeOn';

import { Type, ProviderArg, Inject, Injector, Optional, forwardRef, PostConstruct } from '../di';
import { Renderer, Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef, ElementRef, DocumentRef, ContextType } from '../common';
import { Stack } from '../stack';
import { ViewContainer } from './ViewContainer';
import { ViewConfig, ResolverStrategy, CacheStrategy } from './common';
import { Subject, Observable, BeforeDestroyEvent, BehaviorSubject } from '../events';
import { MakeVisibleCommand, MinimizeCommand } from '../commands';
import { ViewManager } from './ViewManager';
import { ViewFactory } from './ViewFactory';
import { CustomViewHookEvent } from './CustomViewHookEvent';
import { StateContext } from '../StateContext';
import { SizeChanges } from './hooks';

/**
 * A renderable that renders a component.
 * @export
 * @class View
 * @extends {Renderable}
 */
export class View extends Renderable {
  protected _viewContainer: ViewContainer<any>;

  @CompleteOn('destroy')
  protected _visibilityChanges: BehaviorSubject<boolean> = new BehaviorSubject(true);

  @CompleteOn('destroy')
  protected _sizeChanges: BehaviorSubject<SizeChanges> = new BehaviorSubject({ width: -1, height: -1 });

  @CompleteOn('destroy')
  protected _viewContainerCreated: Subject<{ fromCache: boolean, container: ViewContainer<any> }> = new Subject();

  protected _initialCreate: boolean = true;
  @Inject(ContainerRef) protected _container: Renderable;
  @Inject(ConfigurationRef) protected _configuration: ViewConfig;
  @Inject(ViewManager) protected _viewManager: ViewManager;
  @Inject(ViewFactory) protected _viewFactory: ViewFactory;
  @Inject(DocumentRef) protected _document: Document;
  @Inject(StateContext) protected _stateContext: StateContext;
  
  /**
   * Notifies when the visibility of this view changes.
   * @type {Observable<boolean>}
   */
  visibilityChanges: Observable<boolean> = this._visibilityChanges.asObservable().distinctUntilChanged();
  /**
   * Notifies when the dimensions of this view changes.
   * @type {Observable<{ width: number, height: number }>}
   */
  sizeChanges: Observable<SizeChanges> = this._sizeChanges.asObservable();

  /**
   * Notifies when the view container is resolved.
   * @type {Observable<ViewContainer<any>>}
   */
  viewContainerCreated: Observable<{ fromCache: boolean, container: ViewContainer<any> }> = this._viewContainerCreated.asObservable();

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  /**
   * Whether this view is configured to be lazy.
   * @readonly
   * @type {(boolean|null)}
   */
  get lazy(): boolean|null {
    return this.resolveConfigProperty<boolean>('lazy');
  }
  
  /**
   * Whether this view in configured to be cacheable.
   * @readonly
   * @type {(boolean|null)}
   */
  get isCacheable(): boolean {
    const cacheStrategy = this.caching;

    if ((cacheStrategy === CacheStrategy.RELOAD && this._stateContext.context === ContextType.NONE) 
      || cacheStrategy === CacheStrategy.PERSISTENT) {
      return true;
    }

    return false;
  }

  get caching(): CacheStrategy|null {
    return this.resolveConfigProperty<CacheStrategy>('caching');
  }
  
  /**
   * The 'ref' string this view is configured with.
   * @readonly
   * @type {(string|null)}
   */
  get ref(): string|null {
    return this.resolveConfigProperty<string>('ref');
  }
  
  /**
   * The resolution strategy this view is configured with.
   * @readonly
   * @type {(ResolverStrategy|null)}
   */
  get resolution(): ResolverStrategy|null {
    return this.resolveConfigProperty<ResolverStrategy>('resolution');
  }
  
  /**
   * The token this view is using for registration.
   * @readonly
   * @type {(any|null)}
   */
  get token(): any|null {
    return this._viewFactory.getTokenFrom(this._configuration);
  }

  get viewComponentConfig(): any | null {
    return this._viewContainer ? this._viewContainer.viewComponentConfig : null;
  }

  @PostConstruct()
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

  /**
   * Closes this view.
   * @emits {BeforeDestroyEvent} Fired when not silent.
   * @param {{ silent?: boolean }} [args={}] 
   */
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

  /**
   * Makes this view visible.
   * @emits {MakeVisibileCommand}
   */
  makeVisible(): void {
    this.emitUp(new MakeVisibleCommand(this));
  }

  /**
   * Minimizes this view if applicable.
   * @emits {MinimizeCommand}
   */
  minimize(): void {
    this.emitUp(new MinimizeCommand(this));
  }

  /**
   * Resolves a views config property. Checks the configuration given to the
   * view renderable first then checks the component metadata.
   * @template T The return type.
   * @param {string} path 
   * @returns {(T|null)} 
   */
  resolveConfigProperty<T>(path: string): T|null {
    return this._viewFactory.resolveConfigProperty<T>(this._configuration, path);
  }

  /**
   * Invoked on every render cycle.
   * @private
   */
  private _postRender(): void {
    // Check for these changes every render iteration.
    this._visibilityChanges.next(this.isVisible());
    this._sizeChanges.next({ width: this.width, height: this.height });
  }

  /**
   * Invoked when snabbdom has created the HTML element for this view.
   * @private
   * @param {HTMLElement} element 
   */
  private _onCreate(element: HTMLElement): void {
    if (!this._viewContainer) {
      let container = this._viewManager.resolve<any>(this._configuration);
      let fromCache = false;

      if (container) {
        fromCache = true;

        if (container.hasComponent) {
          container.resolve({ fromCache: true });
        }
      } else {
        container = this._viewManager.create({
          config: this._configuration,
          injector: this.injector
        });
      }

      this._viewContainer = container;
      this._viewContainerCreated.next({ fromCache, container: this._viewContainer });
    }

    this._viewContainer.setView(this);
    this._viewContainer.attach();
    this._viewContainer.mountTo(element);
  }

  /**
   * Configures a view.
   * @static
   * @param {ViewConfig} config 
   * @returns {ConfiguredRenderable<View>} 
   */
  static configure(config: ViewConfig): ConfiguredRenderable<View> {
    return new ConfiguredRenderable(View, config);
  }
}