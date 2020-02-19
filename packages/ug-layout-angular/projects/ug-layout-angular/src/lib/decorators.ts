import {
  ViewComponent as _ViewComponent,
  VIEW_CONFIG_KEY
} from 'ug-layout';

import {
  ViewComponentConfigArgs
} from './common';

export function ViewComponent(config?: ViewComponentConfigArgs): ClassDecorator {
  return (target: Function) => {
    _ViewComponent(target);

    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, target);

    Reflect.defineMetadata(VIEW_CONFIG_KEY, Object.assign({ upgrade: false }, metadata, config), target);
  };
}