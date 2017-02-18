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
  
  beforeDestroy: Observable<BeforeDestroyEvent<Renderable>> = this._container.scope(BeforeDestroyEvent);
  destroyed: Observable<Renderable> = this._container.destroyed;
  visibilityChanges: Observable<boolean> = this._container.visibilityChanges;
  sizeChanges: Observable<{ width: number, height: number }> = this._container.sizeChanges;
  status: Observable<ViewContainerStatus>;
  statusReady: Observable<ViewContainerStatus>;
  mount: Observable<HTMLElement>;

  private _component: T;
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);
  private _mount: ReplaySubject<HTMLElement> = new ReplaySubject(1);
  
  constructor(
    @Inject(ContainerRef) protected _container: View,
    @Inject(Injector) protected _injector: Injector
  ) {
    this.status = this._status.asObservable();  
    this.mount = this._mount.asObservable().filter(isObject);
    this.statusReady = this.status.filter(eq(ViewContainerStatus.READY));
  }

  get ready(): Promise<ViewContainer<T>> {
    return this.status
      .filter(eq(ViewContainerStatus.READY))
      .toPromise()
      .then(() => this);
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
    this._mount.complete();
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

  _attach(element: HTMLElement): void {
    this._mount.next(element);
  }

  private _onComponentReady(component: T): void {
    this._component = component;
    this._status.next(ViewContainerStatus.READY);
  }
}