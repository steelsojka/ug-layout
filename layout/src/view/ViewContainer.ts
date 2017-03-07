import { Injector, Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { ReplaySubject, Observable, Subject, BeforeDestroyEvent, BehaviorSubject } from '../events';
import { ContainerRef, ConfigurationRef, DocumentRef } from '../common';
import { View } from './View';
import { ViewFactoriesRef, ViewComponentRef } from './common';
import { CustomViewHookEvent } from './CustomViewHookEvent';
import { isFunction, get, uid, eq, isPromise, isObject } from '../utils';

export enum ViewContainerStatus {
  READY,
  PENDING
}

export enum ViewContainerAttachedStatus {
  ATTACHED,
  DETACHED
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
  private _element: HTMLElement = this._document.createElement('div');
  private _component: T|null = null;
  private _container: View|null;
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);
  private _destroyed: Subject<ViewContainer<T>> = new Subject();
  private _beforeDestroy: Subject<BeforeDestroyEvent<Renderable>> = new Subject();
  private _containerChange: Subject<View|null> = new Subject<View|null>();
  private _visibilityChanges: Subject<boolean> = new Subject();
  private _sizeChanges: Subject<{ width: number, height: number }> = new Subject();
  private _attached: Subject<boolean> = new Subject();
  private _initialized: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  private _isInitialized: boolean = false;
  
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
  sizeChanges: Observable<{ width: number, height: number }> = this._sizeChanges.asObservable();
  /**
   * Notifies when the status of this component changes.
   * @type {Observable<ViewContainerStatus>}
   */
  status: Observable<ViewContainerStatus> = this._status.asObservable();
  /**
   * Notifies when the component is ready.
   * @type {Observable<ViewContainerStatus>}
   */
  statusReady: Observable<ViewContainerStatus> = this.status.filter(eq(ViewContainerStatus.READY));
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
   * Creates an instance of ViewContainer.
   * @param {Document} _document 
   * @param {Injector} _injector 
   */
  constructor(
    @Inject(DocumentRef) protected _document: Document,
    @Inject(Injector) protected _injector: Injector
  ) {
    this._element.classList.add('ug-layout__view-container-mount');

    this.attached.subscribe(() => this._executeHook('ugOnAttach', this._container));
    this.detached.subscribe(() => this._executeHook('ugOnDetach'));
    this.sizeChanges.subscribe(dimensions => this._executeHook('ugOnResize', dimensions));
    this.visibilityChanges.subscribe(isVisible => this._executeHook('ugOnVisibilityChange', isVisible));
    this.beforeDestroy.subscribe(event => this._executeHook('ugOnBeforeDestroy', event));
    this.initialized.subscribe(v => this._isInitialized = v);
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

  /**
   * Whether the container is cacheable.
   * @readonly
   * @type {boolean}
   */
  get isCacheable(): boolean {
    return this._container ? Boolean(this._container.resolveConfigProperty('cacheable')) : false;
  }

  /**
   * The HTML element for this container.
   * @readonly
   * @type {HTMLElement}
   */
  get element(): HTMLElement {
    return this._element;
  }

  /**
   * Get's a token from this containers injector. Note, this should not be used to grab
   * parent renderables or any item that can be changed.
   * @template U The return type.
   * @param {*} token 
   * @returns {(U|null)} 
   */
  get<U>(token: any): U|null {
    return this._injector.get(token, null);
  }

  /**
   * Destroys the container.
   */
  destroy(): void {
    this._destroyed.next();
    
    this._destroyed.complete();
    this._status.complete();
    this._beforeDestroy.complete();
    this._containerChange.complete();
    this._visibilityChanges.complete();
    this._sizeChanges.complete();
    this._initialized.complete();
  }
  
  /**
   * Waits for the component to be ready. If the component is not initialized
   * it will be initialized. This is important when the view is lazy and hasn't
   * been shown yet but we need to interact with the component.
   * @async
   * @param {{ init?: boolean }} [options={}] 
   * @returns {Promise<ViewContainer<T>>} 
   */
  async ready(options: { init?: boolean } = {}): Promise<ViewContainer<T>> {
    const { init = true } = options;
    
    if (!this._isInitialized && init !== false) {
      this.initialize();  
    }
    
    await this.statusReady.toPromise();

    return this;
  }

  /**
   * Initializes the component. This creates the component. 
   */
  initialize(): void {
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
        .takeUntil(this._containerChange)
        .subscribe(() => this._onViewDestroy());
      
      this._container
        .scope(BeforeDestroyEvent)
        .takeUntil(this._containerChange)
        .subscribe(e => this._beforeDestroy.next(e));
      
      this._container.visibilityChanges
        .takeUntil(this._containerChange)
        .subscribe(e => this._visibilityChanges.next(e));
      
      this._container.sizeChanges
        .takeUntil(this._containerChange)
        .subscribe(e => this._sizeChanges.next(e));

      this._container
        .scope(CustomViewHookEvent)
        .takeUntil(this._containerChange)
        .subscribe(event => this._executeHook(event.name, ...event.args));
    }

    this._attached.next(Boolean(this._container));
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
   * Signals up the tree to make this {@link View} visible.
   */
  makeVisible(): void {
    if (this._container) {
      this._container.makeVisible();
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
   * Detaches this container from it's view.
   */
  detach(): void {
    this.setView(null);
  }

  private _onViewDestroy(): void {
    // If this view is cacheable, we don't destroy it.
    if (this.isCacheable) {
      this.detach();
    } else {
      this.destroy();
    }
  }

  private _executeHook(name: string, ...args: any[]): any {
    if (this._component && this._hasHook(name)) {
      return this._component[name].apply(this._component, args);
    }
  }

  private _hasHook(name: string): boolean {
   return Boolean(this._component && isObject(this._component) && isFunction(this._component[name]));
  }

  private async _onComponentReady(component: T): Promise<void> {
    this._component = component;

    const result = this._executeHook('ugOnResolve', this);

    // Allow the `ugOnResolve` hook to run async tasks.
    if (isPromise(result)) {
      await result;
    }
    
    this._status.next(ViewContainerStatus.READY);
    this._executeHook('ugOnInit', this);
  }
}