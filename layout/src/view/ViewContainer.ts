import { Injector, Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { ReplaySubject, Observable, BeforeDestroyEvent, BehaviorSubject } from '../events';
import { ContainerRef, ConfigurationRef } from '../common';
import { View } from './View';
import { ViewFactoriesRef, ViewComponentRef } from './common';
import { uid, eq, isPromise, isObject } from '../utils';

export enum ViewContainerStatus {
  READY,
  PENDING
}

export class ViewContainer<T> {
  readonly id: number = uid();
  
  getParent: <T>(Ctor: Type<T>) => T|null = this._container.getParent.bind(this._container);
  getParents: <T>(Ctor: Type<T>) => T[] = this._container.getParents.bind(this._container);
  makeVisible: () => void = this._container.makeVisible.bind(this._container);
  isVisible: () => void = this._container.isVisible.bind(this._container);
  close: (args: { silent?: boolean }) => Promise<void> = this._container.close.bind(this._container);
  /**
   * Notifies that the view is being destroyed. This action is cancellable or can be halted until
   * an async action is complete.
   * @see Cancellable
   * @type {Observable<BeforeDestroyEvent<Renderable>>}
   */
  beforeDestroy: Observable<BeforeDestroyEvent<Renderable>> = this._container.scope(BeforeDestroyEvent);
  /**
   * Notifies when the view is destroyed.
   * @type {Observable<Renderable>}
   */
  destroyed: Observable<Renderable> = this._container.destroyed;
  /**
   * Notifies when the visibility of this view changes.
   * @type {Observable<boolean>}
   */
  visibilityChanges: Observable<boolean> = this._container.visibilityChanges;
  /**
   * Notifies when the dimensions of this views container has changed.
   * @type {Observable<{ width: number, height: number }>}
   */
  sizeChanges: Observable<{ width: number, height: number }> = this._container.sizeChanges;
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

  private _component: T;
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);
  
  constructor(
    @Inject(ContainerRef) protected _container: View,
    @Inject(Injector) protected _injector: Injector
  ) {
    this.status = this._status.asObservable();  
    this.statusReady = this.status.filter(eq(ViewContainerStatus.READY));
  }

  get ready(): Promise<ViewContainer<T>> {
    return this.statusReady.toPromise().then(() => this);
  }

  get width(): number {
    return this._container.width;
  }
  
  get height(): number {
    return this._container.height;
  }

  get component(): T {
    return this._component;
  }

  get(token: any): any {
    return this._injector.get(token, null);
  }

  destroy(): void {
    this._status.complete();
  }

  initialize(): void {
    const component = this._injector.get(ViewComponentRef);
    
    if (isPromise<T>(component)) {
      component.then(val => this._onComponentReady(val));
    } else {
      this._onComponentReady(component);
    }
  }

  private _onComponentReady(component: T): void {
    this._component = component;
    this._status.next(ViewContainerStatus.READY);
  }
}