import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { isObject, isFunction } from '../utils';

export interface Serialized {
  name: string;
}

export interface SerializeInfo {
  parentId: number;
  config: object;
  name: string;
}

export interface Serializer<R extends Renderable, S extends Serialized> {
  serialize(node: R): S;
  deserialize(serialized: S): RenderableArg<R>;
}

/**
 * An interface for renderables that are serializable.
 * @export
 * @interface Serializable
 * @template T The renderable class.
 * @template S The serialized representation of the renderable.
 */
export interface Serializable {
  serialize(): SerializeInfo;
}

export function isSerializable(value: any): value is Serializable {
  return isObject(value) && isFunction(value.serialize);
}