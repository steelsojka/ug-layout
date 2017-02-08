import { Injector, Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { Observable, AsyncEvent } from '../events';
import { ContainerRef, ConfigurationRef } from '../common';
import { View } from './View';
import { ViewFactoriesRef, ViewComponentRef } from './common';
import { uid } from '../utils';

export class ViewContainer<T> {
  readonly id: number = uid();
  
  getParent: <T>(Ctor: Type<T>) => T|null = this._container.getParent.bind(this._container);
  getParents: <T>(Ctor: Type<T>) => T[] = this._container.getParents.bind(this._container);
  makeVisible: () => void = this._container.makeVisible.bind(this._container);
  isVisible: () => void = this._container.isVisible.bind(this._container);
  close: (args: { silent?: boolean }) => Promise<void> = this._container.close.bind(this._container);
  
  beforeDestroy: Observable<AsyncEvent<this>>;
  destroyed: Observable<this>;

  private _view: T;
  
  constructor(
    @Inject(ContainerRef) protected _container: View,
    @Inject(Injector) protected _injector: Injector
  ) {
    this.beforeDestroy = this._container.beforeDestroy.map(() => new AsyncEvent(this));
    this.destroyed = this._container.destroyed.map(() => this);
  }

  get width(): number {
    return this._container.width;
  }
  
  get height(): number {
    return this._container.height;
  }

  get view(): T {
    return this._view;
  }

  set view(view: T) {
    if (this._view != null) {
      throw new Error('Can not reinitialize view.');
    }

    this._view = view;
  }

  get(token: any): any {
    return this._injector.get(token, null);
  }
}