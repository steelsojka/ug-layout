import { Injector, Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { Observable, BeforeDestroyEvent, BehaviorSubject } from '../events';
import { ContainerRef, ConfigurationRef } from '../common';
import { View } from './View';
import { ViewFactoriesRef, ViewComponentRef } from './common';
import { uid, eq, isPromise } from '../utils';

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

  private _component: T;
  private _status: BehaviorSubject<ViewContainerStatus> = new BehaviorSubject(ViewContainerStatus.PENDING);
  
  constructor(
    @Inject(ContainerRef) protected _container: View,
    @Inject(Injector) protected _injector: Injector,
    @Inject(ViewComponentRef) _maybeComponent: T|Promise<T>
  ) {
    this.status = this._status.asObservable();  

    if (isPromise<T>(_maybeComponent)) {
      _maybeComponent.then(val => this._onComponentReady(val));
    } else {
      this._onComponentReady(_maybeComponent);
    }
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

  private _onComponentReady(component: T): void {
    this._component = component;
    this._status.next(ViewContainerStatus.READY);
  }
}