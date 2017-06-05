import { VNode } from 'snabbdom/VNode';
import { h } from 'snabbdom';

import { Renderable } from '../dom';

export class NoopRenderable extends Renderable {
  render(): VNode {
    return h('div.noop-renderable');
  }
}