import { Serialized, BaseSerializerArg } from '../serialization';

export interface RenderableConfigArgs {
  tags?: string[];
  serializer?: BaseSerializerArg;
}

export interface RenderableConfig extends RenderableConfigArgs {}

export interface SerializedRenderable extends Serialized {
  tags: string[];
  serializer?: Serialized;
}