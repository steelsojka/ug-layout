import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { Crawler } from '../Crawler';
import { isSerializable, Serialized } from './common';

export abstract class Serializer<T extends Renderable, S extends Serialized> {
  abstract serialize(node: T): S;
  abstract deserialize(node: S): RenderableArg<T>;
}