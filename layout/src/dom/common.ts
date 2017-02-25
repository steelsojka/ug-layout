import { RenderableArg } from '../common';
import { Renderable } from './Renderable';

export interface RenderableConfig {
  use: RenderableArg<Renderable>;
  contentItems: RenderableConfig[];
}