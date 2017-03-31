import {
  VIEW_CONFIG_KEY, 
  ViewComponentConfigArgs,
  ResolverStrategy,
  VIEW_QUERY_METADATA,
  ViewQueryConfig,
  ViewQueryConfigArgs,
  ViewQueryReadType,
  ViewQueryInitConfig,
  ViewQueryMetadata
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

export function ViewQuery(config: ViewQueryConfigArgs = {}): MethodDecorator {
  return (target: Object, key: string) => {
    const metadata = Reflect.getOwnMetadata(VIEW_QUERY_METADATA, target) || { queries: [], inits: [] } as ViewQueryMetadata;

    metadata.queries.push({
      read: ViewQueryReadType.CONTAINER,
      method: key,
      ...config,
    });

    Reflect.defineMetadata(VIEW_QUERY_METADATA, metadata, target);
  };
}

export function ViewLinkInit(...injections: any[]): MethodDecorator {
  return (target: Object, key: string) => {
    const metadata = Reflect.getOwnMetadata(VIEW_QUERY_METADATA, target) || { queries: [], inits: [] } as ViewQueryMetadata;

    metadata.inits.push({
      injections,
      method: key,
    });

    Reflect.defineMetadata(VIEW_QUERY_METADATA, metadata, target);
  };
}