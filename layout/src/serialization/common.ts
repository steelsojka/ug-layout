import { Renderable } from '../dom';
import { RenderableConstructorArg } from '../common';
import { isObject, isFunction } from '../utils';

export interface Serialized {
  name: string;
}

export interface Serializer<R extends Renderable, S extends Serialized> {
  serialize(node: R): S;
  deserialize(serialized: S): RenderableConstructorArg<R>;
  exclude?(node: R): boolean;
}