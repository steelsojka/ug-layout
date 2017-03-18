import {
  VIEW_CONFIG_KEY, 
  ViewComponentConfigArgs,
  ResolverStrategy
} from './common';

export function ViewComponent(config: ViewComponentConfigArgs = {}): ClassDecorator {
  return (target: Function): void => {
    config = Object.assign({
      cacheable: false,
      lazy: false,
      resolution: ResolverStrategy.TRANSIENT,
      name: null,
      container: null
    }, config);
    
    Reflect.defineMetadata(VIEW_CONFIG_KEY, config, target);
  };
}