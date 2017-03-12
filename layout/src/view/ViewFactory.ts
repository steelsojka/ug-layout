import {
  ViewComponentConfig, 
  ViewConfig, 
  ViewFactoriesRef, 
  ViewComponentRef, 
  ViewFactoryInterceptorsRef,
  VIEW_CONFIG_KEY
} from './common';
import { Injector, Inject, Optional, ProviderArg, Type } from '../di';
import { View } from './View';
import { ViewContainer } from './ViewContainer';
import { ElementRef, ContainerRef } from '../common';
import { get, isFunction } from '../utils';
import { ViewFactoryInterceptor } from './ViewFactoryInterceptor';

export interface ViewFactoryArgs {
  config: ViewConfig;
  injector?: Injector;
}

/**
 * Responsible for creating view containers from view configurations.
 * @export
 * @class ViewFactory
 */
export class ViewFactory {
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ViewFactoryInterceptorsRef) @Optional() private _interceptors: ViewFactoryInterceptor[]|null
  ) {}

  get interceptors(): ViewFactoryInterceptor[] {
    return this._interceptors || [];
  }
  /**
   * Creates a view container from the given configuration.
   * @template T The component type.
   * @param {ViewFactoryArgs} args 
   * @returns {ViewContainer<T>} 
   */
  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    let { config } = args;
    const { injector = this._injector } = args;
    const isLazy = this.resolveConfigProperty(config, 'lazy');
    
    const providers: ProviderArg[] = [ ViewContainer ];

    config = this.interceptors.reduce((result, interceptor) => interceptor.config(result), config);

    if (config.useFactory) {
      providers.push({
        provide: ViewComponentRef, 
        useFactory: config.useFactory,
        deps: config.deps
      });
    } else if (config.useClass) {
      providers.push({ provide: ViewComponentRef, useClass: config.useClass });
    } else if (config.useValue) {
      providers.push({ provide: ViewComponentRef, useValue: config.useValue });
    } else {
      throw new Error('View config has no creatable view.');
    }

    const viewInjector = Injector.fromInjectable(ViewContainer, providers, injector);
    const viewContainer = viewInjector.get(ViewContainer) as ViewContainer<any>;
    
    viewInjector.registerProvider({ provide: ElementRef, useValue: viewContainer.element });

    // If this view is lazy and it is not already visible wait for the
    // view to become visible before initializing the view container.
    if (isLazy && !viewContainer.isVisible()) {
      viewContainer.visibilityChanges
        .takeUntil(viewContainer.initialized.filter(Boolean))
        .subscribe(() => viewContainer.initialize());
    } else {
      viewContainer.initialize();
    }
     
    return viewContainer;
  }  

  /**
   * Gets the token from a view config. If using `useClass` the class will be used as the token.
   * Any other type will require token to be provided.
   * @param {ViewConfig} config 
   * @returns {*} 
   */
  getTokenFrom(config: ViewConfig): any {
    if (config.token) {
      return config.token;
    }
    
    if (config.useClass) {
      return config.useClass;
    } else if (config.useFactory) {
      return config.useFactory;
    } else if (config.useValue) {
      return config.useValue;
    }

    throw new Error('Can not resolve token from config.');
  }

  /**
   * Resolves a config property by looking at the view config then the components metadata config.
   * @template T The type of the value expected.
   * @param {ViewConfig} config 
   * @param {string} path 
   * @returns {(T|null)} 
   */
  resolveConfigProperty<T>(config: ViewConfig, path: string): T|null {
    const token = this.getTokenFrom(config);
    let result = get(config, path);

    if (result !== undefined) {
      return result as T;
    }

    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    result = get(metadata, path);

    if (result !== undefined) {
      return result as T;
    }

    return null;
  }

  destroy(): void {}
}