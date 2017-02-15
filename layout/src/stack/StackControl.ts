import { Renderable } from '../dom';
import { RenderableArg } from '../common';

export interface StackControlConfig {
  use: RenderableArg<StackControl>
}

export abstract class StackControl extends Renderable {
  
}