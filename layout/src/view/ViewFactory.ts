import {
  ViewComponentConfig, 
  ViewConfig, 
  ViewComponentRef, 
  VIEW_CONFIG_KEY
} from './common';
import { Injector, Inject, Optional, ProviderArg, Type } from '../di';
import { View } from './View';
import { ViewContainer } from './ViewContainer';
import { ElementRef, ContainerRef } from '../common';
import { get, isFunction } from '../utils';

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
    @Inject(Injector) private _injector: Injector
  ) {}

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
    const providers: ProviderArg[] = [ this._getViewContainerProvider(config) ];

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
    if (isLazy) {
      viewContainer.visibilityChanges
        .first(Boolean)
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

    return this.resolveMetaConfigProperty<T>(token, path);
  }

  /**
   * Resolves a config property from the tokens metadata.
   * @template T The return type.
   * @param {*} token 
   * @param {string} path 
   * @returns {(T|null)} 
   */
  resolveMetaConfigProperty<T>(token: any, path: string): T|null {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;
    const result = get(metadata, path);

    if (result !== undefined) {
      return result as T;
    }

    return null;
  }

  destroy(): void {}

  private _getViewContainerProvider(config: ViewConfig): ProviderArg {
    let viewContainerProvider = this.resolveMetaConfigProperty<ProviderArg>(this.getTokenFrom(config), 'container') || ViewContainer;

    if (isFunction(viewContainerProvider)) {
      viewContainerProvider = { provide: ViewContainer, useClass: viewContainerProvider };
    }

    return viewContainerProvider;
  }
}