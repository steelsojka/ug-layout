import { Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { Observable, AsyncEvent } from '../events';
import { ContainerRef, ConfigurationRef } from '../common';
import { View, ViewConfig } from './View';
import { ViewFactoriesRef } from './common';

export class ViewContainer {
  getParent: <T>(Ctor: Type<T>) => T|null = this._container.getParent.bind(this._container);
  getParents: <T>(Ctor: Type<T>) => T[] = this._container.getParents.bind(this._container);
  makeVisible: () => void = this._container.makeVisible.bind(this._container);
  isVisible: () => void = this._container.isVisible.bind(this._container);
  close: (args: { silent?: boolean }) => Promise<void> = this._container.close.bind(this._container);
  
  beforeDestroyed: Observable<AsyncEvent<View>> = this._container.onBeforeDestroy;
  destroyed: Observable<View> = this._container.onDestroy;
  
  constructor(
    @Inject(ContainerRef) protected _container: View
  ) {}

  get width(): number {
    return this._container.width;
  }
  
  get height(): number {
    return this._container.height;
  }
}