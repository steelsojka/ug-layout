import { VNode } from 'snabbdom/vnode';

export interface Renderable {
  readonly width: number;
  readonly height: number;
  
  render(parent?: Renderable): VNode;
  resize(dimensions?: { height: number, width: number }): void;
}