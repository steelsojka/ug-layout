import {
  VIEW_CONFIG_KEY, 
  ViewComponentConfigArgs,
  ResolverStrategy,
  VIEW_LINKER_METADATA,
  ViewQueryConfig,
  ViewQueryConfigArgs,
  ViewQueryReadType,
  ViewQueryInitConfig,
  ViewLinkerMetadata,
  ViewInsertConfigArgs,
  ViewResolveConfigArgs,
  CacheStrategy
} from './common';

/**
 * Registers view metadata with a component class.
 * @export
 * @param {ViewComponentConfigArgs} [config={}] 
 * @returns {ClassDecorator} 
 */
export function ViewComponent(config: ViewComponentConfigArgs = {}): ClassDecorator {
  return (target: Function): void => {
    config = Object.assign({
      caching: null,
      lazy: false,
      resolution: ResolverStrategy.TRANSIENT,
      name: null,
      container: null
    }, config);
    
    Reflect.defineMetadata(VIEW_CONFIG_KEY, config, target);
  };
}

/**
 * Sets up a view query with the decorated method as the callback to receive the query results. 
 * @export
 * @param {ViewQueryConfigArgs} [config={}] 
 * @returns {MethodDecorator} 
 */
export function ViewQuery(config: ViewQueryConfigArgs = {}): MethodDecorator {
  return (target: Object, key: string) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();

    metadata.queries.push({
      read: ViewQueryReadType.COMPONENT,
      method: key,
      ...config,
    });

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target);
  };
}

/**
 * Sets up an init method that is invoked at the time a view is linked by the {@link ViewLinker}. Any dependencies need
 * from the Layouts DI can be injected.
 * @export
 * @param {...any[]} injections Injection tokens for services needing to be injected into the controller.
 * @returns {MethodDecorator} 
 */
export function ViewLinkInit(...injections: any[]): MethodDecorator {
  return (target: Object, key: string) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();

    metadata.inits.push({
      injections,
      method: key,
    });

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target);
  };
}

export function ViewUnlink(): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();

    metadata.unlinks.push(key);

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target);
  };
}

/**
 * Sets up a view insert method.
 * @export
 * @see {@link ViewLinker#wireInsert}
 * @param {ViewInsertConfigArgs} config 
 * @returns {PropertyDecorator} 
 */
export function ViewInsert(config: ViewInsertConfigArgs): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();

    metadata.inserts.push({
      ...config,
      method: key
    });

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target);
  };
}

/**
 * Sets up a view resolve method.
 * @export
 * @see {@link ViewLinker#wireResolve}
 * @param {ViewResolveConfigArgs} config 
 * @returns {PropertyDecorator} 
 */
export function ViewResolve(config: ViewResolveConfigArgs): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();

    metadata.resolves.push({
      ...config,
      method: key
    });

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target);
  };
}

/**
 * Indicates that this class should inherit all metadata from the given constructors.
 * @export
 * @param {Function[]} constructors 
 * @returns {ClassDecorator} 
 */
export function ViewLinkExtends(...constructors: Function[]): ClassDecorator {
  return (target: Function) => {
    const metadata: ViewLinkerMetadata = Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target.prototype) || getDefaultMetadata();

    metadata.extensions.push(...constructors.map(ctor => ctor.prototype));

    Reflect.defineMetadata(VIEW_LINKER_METADATA, metadata, target.prototype);
  };
}

export function getDefaultMetadata(): ViewLinkerMetadata {
  return {
    extensions: [],
    queries: [],
    inits: [],
    inserts: [],
    resolves: [],
    unlinks: []
  };
}
