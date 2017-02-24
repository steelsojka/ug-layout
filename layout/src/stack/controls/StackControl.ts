import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, Injector } from '../../di';
import { Renderable, ConfiguredRenderable } from '../../dom';
import { RenderableArg, ConfigurationRef } from '../../common';
import { defaults } from '../../utils';

export enum StackControlPosition {
  PRE_TAB,
  POST_TAB
}

export interface StackControlConfig {
  position: StackControlPosition;
}

export type StackControlConfigArgs = {
  [P in keyof StackControlConfig]?: StackControlConfig[P];
}

/**
 * Base stack control that all stack controls extend.
 * @export
 * @class StackControl
 * @extends {Renderable}
 */
export class StackControl extends Renderable {
  protected _config: StackControlConfig;
  
  constructor(_injector: Injector) {
    super(_injector);

    this._config = defaults(_injector.get(ConfigurationRef, {}), {
      position: StackControlPosition.POST_TAB  
    });
  }
  
  get position(): StackControlPosition {
    return this._config.position;
  }
  
  isActive(): boolean {
    return true;
  }

  render(): VNode {
    return h('div');
  }

  static configure(config: StackControlConfigArgs): ConfiguredRenderable<StackControl> {
    return new ConfiguredRenderable(this, config);
  }
}