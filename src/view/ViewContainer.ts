import { Type, Inject, Optional } from '../di';
import { Renderable } from '../dom';
import { ContainerRef, ConfigurationRef } from '../common';
import { View, ViewConfig } from './View';
import { ViewFactoriesRef } from './common';

export class ViewContainer {
  constructor(
    @Inject(ContainerRef) protected _container: View
  ) {}

  get width(): number {
    return this._container.width;
  }
  
  get height(): number {
    return this._container.height;
  }

  getParent(Ctor: Type<Renderable>): Renderable|null {
    return this._container.getParent(Ctor);
  }
}