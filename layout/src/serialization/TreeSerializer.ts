import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { Crawler } from '../Crawler';
import { isSerializable, Serialized, Serializable } from './common';
import { Serializer } from './Serializer';

export interface SerializedNode {
  use: string;
  config: object;
}