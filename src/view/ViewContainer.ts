import { Injector, Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { Observable, BeforeDestroyEvent } from '../events';
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
  
  beforeDestroy: Observable<BeforeDestroyEvent<Renderable>> = this._container.scope(BeforeDestroyEvent);
  destroyed: Observable<Renderable> = this._container.destroyed;
  visibilityChanges: Observable<boolean> = this._container.visibilityChanges;
  sizeChanges: Observable<{ width: number, height: number }> = this._container.sizeChanges;

  private _view: T;
  
  constructor(
    @Inject(ContainerRef) protected _container: View,
    @Inject(Injector) protected _injector: Injector
  ) {}

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