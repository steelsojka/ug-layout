import {
  VIEW_CONFIG_KEY, 
  ViewComponentConfigArgs,
  ResolverStrategy
} from './common';

export function ViewComponent(config: ViewComponentConfigArgs = {}): ClassDecorator {
  return (target: Function): void => {
    config = Object.assign({
      resolution: ResolverStrategy.SINGLETON,
      name: null
    }, config);
    
    Reflect.defineMetadata(VIEW_CONFIG_KEY, config, target);
  };
}