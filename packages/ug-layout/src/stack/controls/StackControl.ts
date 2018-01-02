import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, Injector, PostConstruct, Inject } from '../../di';
import { Renderable, ConfiguredRenderable } from '../../dom';
import { RenderableArg, ConfigurationRef } from '../../common';
import { defaults } from '../../utils';
import { StackHeader } from '../StackHeader';

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
  container: StackHeader;
  
  @Inject(ConfigurationRef)
  protected _config: StackControlConfig;

  get position(): StackControlPosition {
    return this._config.position;
  }
  
  @PostConstruct()
  initialize(): void {
    super.initialize();
    
    this._config = defaults(this._config, {
      position: StackControlPosition.POST_TAB  
    });
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