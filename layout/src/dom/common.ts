import { Serialized } from '../serialization';

export interface RenderableConfigArgs {
  tags?: string[];
}

export interface RenderableConfig extends RenderableConfigArgs {}

export interface SerializedRenderable extends Serialized {
  tags: string[];
}