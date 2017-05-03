import { ComponentRef } from '@angular/core';
import { 
  ViewComponent as _ViewComponent, 
  VIEW_CONFIG_KEY
} from 'ug-layout';

import { 
  COMPONENT_REF_KEY, 
  PRIVATE_PREFIX, 
  ViewComponentConfigArgs,
  SCOPE_REF_KEY
} from './common';

const noop = function() {};

export function ViewComponent(config?: ViewComponentConfigArgs): ClassDecorator {
  return (target: Function) => {
    _ViewComponent(target);

    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, target);

    Reflect.defineMetadata(VIEW_CONFIG_KEY, Object.assign({ upgrade: false }, metadata, config), target);
  };
}