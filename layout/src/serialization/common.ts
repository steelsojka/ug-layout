import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { isObject, isFunction } from '../utils';

export interface Serialized {
  name: string;
}

export interface Serializer<R extends Renderable, S extends Serialized> {
  serialize(node: R): S;
  deserialize(serialized: S): RenderableArg<R>;
}