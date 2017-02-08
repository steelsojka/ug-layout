import {
  VIEW_CONFIG_KEY, 
  ViewComponentConfig,
  ResolverStrategy
} from './common';

export function ViewComponent(config: ViewComponentConfig): ClassDecorator {
  return (target: Function): void => {
    config = Object.assign({
      resolution: ResolverStrategy.SINGLETON,
      name: null
    }, config);
    
    Reflect.defineMetadata(VIEW_CONFIG_KEY, config, target);
  };
}