import { CompleteOn } from 'rx-decorators/completeOn';

import { Injector, Type, Inject, PostConstruct, forwardRef } from '../di';
import { Renderable, RenderableDestroyedContext } from '../dom';
import { Observable, Subject, BeforeDestroyEvent, BehaviorSubject } from '../events';
import { DocumentRef, ContextType } from '../common';
import { View } from './View';
import { ViewFactory } from './ViewFactory';
import {
  ViewComponentRef,
  VIEW_COMPONENT_CONFIG,
  VIEW_CONFIG,
  ViewConfig
} from './common';
import { CustomViewHookEvent } from './CustomViewHookEvent';
import { ViewHookExecutor, SizeChanges } from './hooks';
import { get, uid, eq, isPromise } from '../utils';
import { ViewFailReason } from './ViewFailReason';
import { CacheStrategy } from './common';

export enum ViewContainerStatus {
  READY,
  PENDING,
  FAILED
}

export enum ViewContainerAttachedStatus {
  ATTACHED,
  DETACHED
}

export const FAILED_RESOLVE = new ViewFailReason('Failed resolve hook');

export interface ViewContainerReadyOptions {
  /**
   * Whether to initiale the component.
   * @type {boolean}
   */
  init?: boolean;
  /**
   * Statuses that tell when the component is ready.
   * @type {ViewContainerStatus[]}
   */
  when?: ViewContainerStatus[];
  /**
   * When the view transitions to one of these statuses then it will stop listening for status
   * updates and the observable will complete without the component being emitted as ready.
   * @type {ViewContainerStatus[]}
   */
  until?: ViewContainerStatus[];
}

/**
 * A container that holds a 1 to 1 relationship with a component instance. This instance
 * is the main API for a component to interact with the layout framework.
 * @export
 * @class ViewContainer
 * @template T The component type.
 */
export class ViewContainer<T> {
  /**
   * This element is the mount point that views can mount to.
   * The node created by the render method gets recreated when moved
   * somewhere else in the tree. This element is constant.
   * @private
   * @type {HTMLElement}
   */
  private _element: HTMLElement;
  private _component: T|null = null;
  private _container: View|null;

  @CompleteOn('destroy')
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);

  @CompleteOn('destroy')
  private _destroyed: Subject<ViewContainer<T>> = new Subject();

  @CompleteOn('destroy')
  private _beforeDestroy: Subject<BeforeDestroyEvent<Renderable>> = new Subject();

  @CompleteOn('destroy')
  private _containerChange: Subject<View|null> = new Subject<View|null>();

  @CompleteOn('destroy')
  private _containerSource: BehaviorSubject<View | null> = new BehaviorSubject(null);

  @CompleteOn('destroy')
  private _visibilityChanges: BehaviorSubject<boolean> = new BehaviorSubject(true);

  @CompleteOn('destroy')
  private _sizeChanges: BehaviorSubject<SizeChanges> = new BehaviorSubject({ width: -1, height: -1 });

  @CompleteOn('destroy')
  private _attached: Subject<boolean> = new Subject();

  @CompleteOn('destroy')
  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @CompleteOn('destroy')
  private _componentReady: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  @CompleteOn('destroy')
  private _componentInitialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _isInitialized: boolean = false;
  private _retry: Function|null = null;
  private _statusInternal: ViewContainerStatus;
  private _failedReason: ViewFailReason|null = null;
  private _isAttached: boolean = true;

  @Inject(DocumentRef) protected _document: Document;
  @Inject(Injector) protected _injector: Injector;
  @Inject(ViewHookExecutor) protected _viewHookExecutor: ViewHookExecutor;
  @Inject(forwardRef(() => ViewFactory)) protected _viewFactory: ViewFactory;
  @Inject(VIEW_COMPONENT_CONFIG) protected _viewComponentConfig: any;
  @Inject(VIEW_CONFIG) protected _viewConfig: ViewConfig;

  /**
   * A unique identifier for this instance.
   * @type {number}
   */
  readonly id: number = uid();
  /**
   * Notifies that the view is being destroyed. This action is cancellable or can be halted until
   * an async action is complete.
   * @see Cancellable
   * @type {Observable<BeforeDestroyEvent<Renderable>>}
   */
  beforeDestroy: Observable<BeforeDestroyEvent<Renderable>> = this._beforeDestroy.asObservable();
  /**
   * Notifies when the view is destroyed.
   * @type {Observable<ViewContainer<T>>}
   */
  destroyed: Observable<ViewContainer<T>> = this._destroyed.asObservable();
  /**
   * Notifies when the visibility of this view changes.
   * @type {Observable<boolean>}
   */
  visibilityChanges: Observable<boolean> = this._visibilityChanges.asObservable();
  /**
   * Notifies when the dimensions of this views container has changed.
   * @type {Observable<{ width: number, height: number }>}
   */
  sizeChanges: Observable<{ width: number, height: number }> = this._sizeChanges
    .asObservable()
    .filter(e => e.height !== -1 && e.width !== -1)
    .distinctUntilChanged((p, c) => p.width === c.width && p.height === c.height)
  /**
   * Notifies when the status of this component changes.
   * @type {Observable<ViewContainerStatus>}
   */
  status: Observable<ViewContainerStatus> = this._status.asObservable();
  /**
   * Contains the state of ths views initialized state.
   * @type {Observable<boolean>}
   */
  initialized: Observable<boolean> = this._initialized.asObservable();
  /**
   * Notifies when this container has changed the {@link View} it is associated with.
   * @type {(Observable<View|null>)}
   */
  containerChange: Observable<View|null> = this._containerChange.asObservable();
  /**
   * Notifies when the view has become attached.
   * @type {Observable<boolean>}
   */
  attached: Observable<boolean> = this._attached.asObservable().filter(eq(true));
  /**
   * Notifies when the view has become detached.
   * @type {Observable<boolean>}
   */
  detached: Observable<boolean> = this._attached.asObservable().filter(eq(false));
  /**
   * Notifies when the component is assigned to the container and ready for access.
   * @type {Observable<boolean>}
   */
  componentReady: Observable<boolean> = this._componentReady.asObservable();
  /**
   * Notifies when the component is initialized.
   * @type {Observable<boolean>}
   */
  componentInitialized: Observable<boolean> = this._componentInitialized.asObservable();
  /**
   * Emits the current container upon subscription and any other changes.
   * @type {(Observable<View | null>)}
   */
  container: Observable<View | null> = this._containerSource.asObservable();

  get hasComponent(): boolean {
    return Boolean(this._component);
  }

  get failedReason(): ViewFailReason|null {
    return this._failedReason;
  }

  get viewComponentConfig(): any {
    return this._viewComponentConfig;
  }

  get config(): ViewConfig {
    return this._viewConfig;
  }

  /**
   * Current width in pixels.
   * @readonly
   * @type {number}
   */
  get width(): number {
    return get(this._container, 'width', 0);
  }

  /**
   * Current height in pixels.
   * @readonly
   * @type {number}
   */
  get height(): number {
    return get(this._container, 'height', 0);
  }

  /**
   * The component instance associated with this container.
   * @readonly
   * @type {T|null}
   */
  get component(): T|null {
    return this._component;
  }

  get caching(): CacheStrategy {
    return this.resolveConfigProperty<CacheStrategy>('caching') || CacheStrategy.NONE;
  }

  /**
   * The HTML element for this container.
   * @readonly
   * @type {HTMLElement}
   */
  get element(): HTMLElement {
    return this._element;
  }

  get view(): View|null {
    return this._container;
  }

  /**
   * Determines whether the view is attached to a Renderable or not.
   * @readonly
   * @type {boolean}
   */
  get isAttached(): boolean {
    return this._isAttached;
  }

  @PostConstruct()
  init(): void {
    this._element = this._document.createElement('div');
    this._element.classList.add('ug-layout__view-container-mount');

    this.attached.subscribe(() => this._executeHook('ugOnAttach', this._container));
    this.detached.subscribe(() => this._executeHook('ugOnDetach'));
    this.sizeChanges.subscribe(dimensions => this._executeHook('ugOnSizeChange', dimensions));
    this.visibilityChanges.subscribe(isVisible => this._executeHook('ugOnVisibilityChange', isVisible));
    this.beforeDestroy.subscribe(event => this._executeHook('ugOnBeforeDestroy', event));
    this.initialized.subscribe(v => this._isInitialized = v);
    this.containerChange.subscribe(container => this._containerSource.next(container));

    // Reset the retry function when the component is no longer failed.
    this.status.filter(eq(ViewContainerStatus.READY)).subscribe(() => {
      this._retry = null;
      this._failedReason = null;
    });
    this.status.subscribe(s => this._statusInternal = s);
  }

  /**
   * Get's a token from this containers injector. Note, this should not be used to grab
   * parent renderables or any item that can be changed.
   * @template U The return type.
   * @param {*} token
   * @returns {(U|null)}
   */
  get<U>(token: any): U|null {
    return this._injector.get<U>(token, null);
  }

  /**
   * Destroys the container.
   */
  destroy(): void {
    this._destroyed.next();
  }

  /**
   * Whether the container is cacheable.
   * @param {ContextType} context The current context
   * @returns {boolean}
   */
  isCacheable(context: ContextType = ContextType.NONE): boolean {
    const cacheStrategy = this.caching;

    switch (cacheStrategy) {
      case CacheStrategy.RELOAD:
        return context === ContextType.RESET;
      case CacheStrategy.PERSISTENT:
        return true;
      default:
        return false;
    }
  }


  /**
   * Waits for the component to be ready. If the component is not initialized
   * it will be initialized. This is important when the view is lazy and hasn't
   * been shown yet but we need to interact with the component.
   * @async
   * @param {{ init?: boolean }} [options={}]
   * @returns {Promise<ViewContainer<T>>}
   */
  ready(options: ViewContainerReadyOptions = {}): Observable<ViewContainer<T>> {
    return Observable.create(observer => {
      const {
        init = true,
        when = [ ViewContainerStatus.READY, ViewContainerStatus.FAILED ],
        until = []
      } = options;

      if (!this._isInitialized && init !== false) {
        this.initialize();
      }

      return this.status
        .subscribe(status => {
          if (when.indexOf(status) !== -1) {
            observer.next(this);
            observer.complete();
          } else if (until.indexOf(status) !== -1) {
            observer.complete();
          }
        });
    });
  }

  /**
   * Initializes the component. This creates the component.
   */
  initialize(): void {
    if (this._isInitialized) {
      return;
    }

    const component = this._injector.get(ViewComponentRef);

    if (isPromise<T>(component)) {
      component.then(val => this._onComponentReady(val));
    } else {
      this._onComponentReady(component);
    }

    this._initialized.next(true);
  }

  /**
   * Sets the containing {@link View} for this container.
   * @param {(View|null)} container
   * @returns {void}
   */
  setView(container: View|null): void {
    if (container === this._container) {
      return;
    }

    this._container = container;

    // This needs to fire before we wire up to the new container.
    this._containerChange.next(container);

    if (this._container) {
      this._container.destroyed
        .takeUntil(this.containerChange)
        .subscribe(context => this._onViewDestroy(context));

      this._container
        .scope(BeforeDestroyEvent)
        .takeUntil(this.containerChange)
        .subscribe(e => this._beforeDestroy.next(e));

      this._container.visibilityChanges
        .takeUntil(this.containerChange)
        .subscribe(e => this._visibilityChanges.next(e));

      this._container.sizeChanges
        .takeUntil(this.containerChange)
        .subscribe(e => this._sizeChanges.next(e));

      this._container
        .scope(CustomViewHookEvent)
        .takeUntil(this.containerChange)
        .subscribe(e => this._onCustomViewHook(e));
    }
  }

  /**
   * Gets this renderables parent or any parent that is
   * an instance of the passed in constructor. If non is found
   * then null is returned.
   * @template T The constructor type.
   * @param {Type<T>} [Ctor]
   * @returns {(T|null)}
   */
  getParent<U extends Renderable>(Ctor: Type<U>): U|null {
    return this._container ? this._container.getParent(Ctor) : null;
  }

  /**
   * Gets this renderables parents or any parents that are
   * an instance of the passed in constructor.
   * @template T The constructor type.
   * @param {Type<T>} [Ctor]
   * @returns {(T|null)}
   */
  getParents<U extends Renderable>(Ctor: Type<U>): U[] {
    return this._container ? this._container.getParents(Ctor) : [];
  }

  /**
   * Queries for a parent renderable for the view.
   * @template U
   * @param {(Type<U> | Type<U>[])} Ctor
   * @returns {(Observable<[ U | null, Observable<void> ]>)}
   */
  queryParent<U extends Renderable>(Ctor: Type<U> | Type<U>[]): Observable<U | null> {
    return this.container
      .switchMap<View | null, U | null>(
        container => container ? container.queryParent(Ctor) : Observable.empty());
  }

  /**
   * Signals up the tree to make this {@link View} visible.
   */
  makeVisible(): void {
    if (this._container) {
      this._container.makeVisible();
    }
  }

  /**
   * Minimizes the view if applicable
   */
  minimize(isMinimized: boolean = true): void {
    if (this._container) {
      this._container.minimize(isMinimized);
    }
  }

  /**
   * Determines whether this renderable is visible.
   * @returns {boolean}
   */
  isVisible(): boolean {
    return this._container ? this._container.isVisible() : false;
  }

  /**
   * Closes this view.
   * @param {{ silent?: boolean }} args
   */
  close(args: { silent?: boolean }): void {
    if (this._container) {
      this._container.close(args);
    }
  }

  /**
   * Mounts this containers element to the given element.
   * @param {HTMLElement} element
   */
  mountTo(element: HTMLElement): void {
    element.appendChild(this._element);
  }

  /**
   * Mounts an element to this containers element.
   * @param {HTMLElement} element
   */
  mount(element: HTMLElement): void {
    this._element.appendChild(element);
  }

  /**
   * Sets all the content of this containers element to the given HTML string.
   * @param {string} html
   */
  mountHTML(html: string): void {
    this._element.innerHTML = html;
  }

  /**
   * Detaches this container.
   */
  detach(): void {
    if (this._isAttached) {
      this._isAttached = false;
      this._attached.next(false);
    }
  }

  /**
   * Attaches this container.
   */
  attach(): void {
    if (!this._isAttached) {
      this._isAttached = true;
      this._attached.next(true);
    }
  }

  fail(reason: ViewFailReason, retry?: Function|null): void {
    // Can be nulled with explicit null value
    if (retry || retry === null) {
      this._retry = retry;
    }

    this._failedReason = reason;
    this._status.next(ViewContainerStatus.FAILED);
  }

  retry(): void {
    if (this._retry) {
      this._retry();
    }
  }

  /**
   * Resolves the container. Note, the component must be created or else an error will be thrown.
   * @throws Error
   * @param {{ fromCache?: boolean }} [options={}]
   * @returns {Promise<void>}
   */
  async resolve(options: { fromCache?: boolean } = {}): Promise<void> {
    const { fromCache = false } = options;

    if (!this.hasComponent) {
      throw new Error('Can not resolve container without component being ready.');
    }

    this._status.next(ViewContainerStatus.PENDING);

    try {
      await this._executeHook('ugOnResolve', { fromCache });
      this._status.next(ViewContainerStatus.READY);
    } catch(e) {
      this.fail(FAILED_RESOLVE, () => this.resolve({ fromCache }));
      throw e;
    }
  }

  /**
   * Triggers a size change event. This doesn't resize the view. This is merely
   * to force a resize event to a component. This is useful for sizing a component
   * that has now view attached to it.
   * @param {SizeChanges} event
   */
  triggerSizeChange(event: SizeChanges): void {
    this._sizeChanges.next(event);
  }

  /**
   * Triggers a visibility change event. This is merely
   * to force a visibility event to a component.
   * @param {SizeChanges} event
   */
  triggerVisibilityChange(isVisible: boolean): void {
    this._visibilityChanges.next(isVisible);
  }

  /**
   * Resolves a config property by checking the config on the currently attached container first,
   * then the config the ViewContainer was created with, then the metadata defined for the component.
   * @template T
   * @param {string} path
   * @returns {(T | null)}
   */
  resolveConfigProperty<T>(path: string): T | null {
    if (this._container) {
      const value = get<T | undefined>(this._container.configuration, path, undefined);

      if (value !== undefined) {
        return value;
      }
    }

    return this._viewFactory.resolveConfigProperty<T>(this._viewConfig, path);
  }


  /**
   * Invoked when the view renderable is destroyed.
   * @private
   */
  private _onViewDestroy(context: RenderableDestroyedContext<View>): void {
    // If this view is cacheable, we don't destroy it.
    if (this.isCacheable(context.context)) {
      this.detach();
    } else {
      this.destroy();
    }
  }

  /**
   * Executes a hook on the component.
   * @private
   * @param {string} name
   * @param {...any[]} args
   * @returns {*}
   */
  private _executeHook(name: string, arg?: any): any {
    if (this._component) {
      return this._viewHookExecutor.execute<T>(this._component, name, arg);
    }
  }

  private _onCustomViewHook(event: CustomViewHookEvent<any>): void {
    if (event.execute) {
      event.execute(this, this._viewHookExecutor, event);
    } else {
      this._executeHook(event.name, event.arg);
    }
  }

  /**
   * Invoked when the component is resolved from the initialization.
   * @private
   * @async
   * @param {T} component
   * @returns {Promise<void>}
   */
  private async _onComponentReady(component: T): Promise<void> {
    this._component = component;

    // Link up any hooks right when the component is instantiated.
    this._viewHookExecutor.link(this, this._component.constructor.prototype);
    this._componentReady.next(true);
    this._executeHook('ugOnLink', this);

    if (this._statusInternal === ViewContainerStatus.FAILED) {
      return;
    }

    await this.resolve();

    this._executeHook('ugOnInit', this);
    this._componentInitialized.next(true);
  }
}