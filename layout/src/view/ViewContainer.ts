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

export class ViewContainer<T> {
  readonly id: number = uid();
  
  /**
   * Notifies that the view is being destroyed. This action is cancellable or can be halted until
   * an async action is complete.
   * @see Cancellable
   * @type {Observable<BeforeDestroyEvent<Renderable>>}
   */
  beforeDestroy: Observable<BeforeDestroyEvent<Renderable>>;
  /**
   * Notifies when the view is destroyed.
   * @type {Observable<ViewContainer<T>>}
   */
  destroyed: Observable<ViewContainer<T>>;
  /**
   * Notifies when the visibility of this view changes.
   * @type {Observable<boolean>}
   */
  visibilityChanges: Observable<boolean>;
  /**
   * Notifies when the dimensions of this views container has changed.
   * @type {Observable<{ width: number, height: number }>}
   */
  sizeChanges: Observable<{ width: number, height: number }>;
  /**
   * Notifies when the status of this component changes.
   * @type {Observable<ViewContainerStatus>}
   */
  status: Observable<ViewContainerStatus>;
  /**
   * Notifies when the component is ready.
   * @type {Observable<ViewContainerStatus>}
   */
  statusReady: Observable<ViewContainerStatus>;
  containerChange: Observable<View|null>;
  attached: Observable<boolean>;
  detached: Observable<boolean>;

  /**
   * This element is the mount point that views can mount to.
   * The node created by the render method gets recreated when moved
   * somewhere else in the tree. This element is constant.
   * @private
   * @type {HTMLElement}
   */
  private _element: HTMLElement = this._document.createElement('div');
  private _component: T;
  private _container: View|null;
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);
  private _destroyed: Subject<ViewContainer<T>> = new Subject();
  private _beforeDestroy: Subject<BeforeDestroyEvent<Renderable>> = new Subject();
  private _containerChange: Subject<View|null> = new Subject<View|null>();
  private _visibilityChanges: Subject<boolean> = new Subject();
  private _sizeChanges: Subject<{ width: number, height: number }> = new Subject();
  private _attached: Subject<boolean> = new Subject();
  
  constructor(
    @Inject(DocumentRef) protected _document: Document,
    @Inject(Injector) protected _injector: Injector
  ) {
    this.destroyed = this._destroyed.asObservable();
    this.beforeDestroy = this._beforeDestroy.asObservable();
    this.visibilityChanges = this._visibilityChanges.asObservable();
    this.sizeChanges = this._sizeChanges.asObservable();
    this.containerChange = this._containerChange.asObservable();
    this.attached = this._attached.asObservable().filter(eq(true));
    this.detached = this._attached.asObservable().filter(eq(false));
    this.status = this._status.asObservable();  
    this.statusReady = this.status.filter(eq(ViewContainerStatus.READY));
    this._element.classList.add('ug-layout__view-container-mount');

    this.attached.subscribe(() => this._executeHook('ugOnAttach', this._container));
    this.detached.subscribe(() => this._executeHook('ugOnDetach'));
    this.sizeChanges.subscribe(dimensions => this._executeHook('ugOnResize', dimensions));
    this.visibilityChanges.subscribe(isVisible => this._executeHook('ugOnVisibilityChange', isVisible));
    this.beforeDestroy.subscribe(event => this._executeHook('ugOnBeforeDestroy', event));
  }

  get ready(): Promise<ViewContainer<T>> {
    return this.statusReady.toPromise().then(() => this);
  }

  get width(): number {
    return get(this._container, 'width', 0);
  }
  
  get height(): number {
    return get(this._container, 'height', 0);
  }

  get component(): T {
    return this._component;
  }

  get isCacheable(): boolean {
    return this._container ? Boolean(this._container.resolveConfigProperty('cacheable')) : false;
  }

  get element(): HTMLElement {
    return this._element;
  }

  get(token: any): any {
    return this._injector.get(token, null);
  }

  destroy(): void {
    this._destroyed.next();
    
    this._destroyed.complete();
    this._status.complete();
    this._beforeDestroy.complete();
    this._containerChange.complete();
    this._visibilityChanges.complete();
    this._sizeChanges.complete();
  }

  initialize(): void {
    const component = this._injector.get(ViewComponentRef);
    
    if (isPromise<T>(component)) {
      component.then(val => this._onComponentReady(val));
    } else {
      this._onComponentReady(component);
    }
  }

  setView(container: View|null): void {
    if (container === this._container) {
      return;
    }
    
    this._container = container;
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

  getParent<U extends Renderable>(Ctor: Type<U>): U|null {
    return this._container ? this._container.getParent(Ctor) : null;
  }
  
  getParents<U extends Renderable>(Ctor: Type<U>): U[] {
    return this._container ? this._container.getParents(Ctor) : [];
  }
  
  makeVisible(): void {
    if (this._container) {
      this._container.makeVisible();
    }
  }
  
  isVisible(): boolean {
    return this._container ? this._container.isVisible() : false;
  }
  
  close(args: { silent?: boolean }): void {
    if (this._container) {
      this._container.close(args);
    }
  }

  mountTo(element: HTMLElement): void {
    if (Array.prototype.indexOf.call(element.children, this._element) === -1) {
      element.appendChild(this._element);
    }
  }
  
  mount(element: HTMLElement): void {
    this._element.appendChild(element);
  }

  detach(): void {
    this.setView(null);
  }

  private _onViewDestroy(): void {
    if (this.isCacheable) {
      this.detach();
    } else {
      this.destroy();
    }
  }

  private _executeHook(name: string, ...args: any[]): void {
    if (isObject(this._component) && isFunction(this._component[name])) {
      this._component[name].apply(this._component, args);
    }
  }

  private _onComponentReady(component: T): void {
    this._component = component;
    this._status.next(ViewContainerStatus.READY);
  }
}