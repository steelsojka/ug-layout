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
}