import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { isObject, isFunction } from '../utils';

export interface Serialized {}

export interface Serializable<T extends Renderable, S extends Serialized> {
  serialize(): S;
  deserialize(config: S): RenderableArg<T>;
}

export function isSerializable(value: any): value is Serializable<Renderable, Serialized> {
  return isObject(value) && isFunction(value.serialize) && isFunction(value.deserialize);
}