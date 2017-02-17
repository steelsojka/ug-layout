import { Type } from '../di';
import { Renderable } from './Renderable'

export class ConfiguredRenderable<T extends Renderable> {
  constructor(
    private _renderable: Type<T>, 
    private _config: any
  ) {}

  get renderable(): Type<T> {
    return this._renderable;
  }

  get config(): any {
    return this._config;
  }

  static resolve<T extends Renderable>(item: Type<T>|ConfiguredRenderable<T>|T): Type<T> {
    if (item instanceof ConfiguredRenderable) {
      return item._renderable;
    }  

    if (item instanceof Renderable) {
      return item.constructor as Type<T>;
    }

    return item;
  }
}