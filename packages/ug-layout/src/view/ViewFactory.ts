import { filter, delay, take } from 'rxjs/operators';

import {
  ViewComponentConfig,
  ViewConfig,
  ViewComponentRef,
  VIEW_CONFIG_KEY,
  VIEW_COMPONENT_CONFIG,
  VIEW_CONFIG
} from './common';
import { Injector, Inject, ProviderArg } from '../di';
import { ConfiguredItem } from '../ConfiguredItem';
import { ViewContainer } from './ViewContainer';
import { ElementRef } from '../common';
import { get, isFunction } from '../utils';
import { VIEW_CONTAINER_CLASS } from './common';

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
  @Inject(Injector) protected _injector: Injector;
  @Inject(VIEW_CONTAINER_CLASS) protected _ViewContainer: typeof ViewContainer;

  /**
   * Creates a view container from the given configuration.
   * @template T The component type.
   * @param {ViewFactoryArgs} args
   * @returns {ViewContainer<T>}
   */
  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    let { config } = args;
    let viewConfig = null;
    const { injector = this._injector } = args;
    const isLazy = this.resolveConfigProperty(config, 'lazy');
    const providers: ProviderArg[] = [
      this._getViewContainerProvider(config),
      { provide: VIEW_CONFIG, useValue: config }
    ];

    if (config.useFactory) {
      viewConfig = ConfiguredItem.resolveConfig<any>(config.useFactory, null);

      providers.push({
        provide: ViewComponentRef,
        useFactory: ConfiguredItem.resolveItem(config.useFactory),
        deps: config.deps
      });
    } else if (config.useClass) {
      viewConfig = ConfiguredItem.resolveConfig<any>(config.useClass, null);

      providers.push({ provide: ViewComponentRef, useClass: ConfiguredItem.resolveItem(config.useClass) });
    } else if (config.useValue) {
      providers.push({ provide: ViewComponentRef, useValue: config.useValue });
    } else {
      throw new Error('View config has no creatable view.');
    }

    providers.push({
      provide: VIEW_COMPONENT_CONFIG,
      useValue: viewConfig != null ? viewConfig : undefined // Use undefined to allow for default assignment
    });

    const viewInjector = Injector.fromInjectable(ViewContainer, providers, injector);
    const viewContainer = viewInjector.get<ViewContainer<T>>(ViewContainer);

    viewInjector.registerProvider({ provide: ElementRef, useValue: viewContainer.element });

    // If this view is lazy and it is not already visible wait for the
    // view to become visible before initializing the view container.
    if (isLazy) {
      viewContainer.visibilityChanges
        .pipe(
          filter(() => viewContainer.isVisible()),
          take(1),
          delay(0))
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
      return ConfiguredItem.resolveItem(config.useClass);
    } else if (config.useFactory) {
      return ConfiguredItem.resolveItem(config.useFactory);
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

  protected _getViewContainerProvider(config: ViewConfig): ProviderArg {
    let viewContainerProvider = this.resolveMetaConfigProperty<ProviderArg>(this.getTokenFrom(config), 'container') || this._ViewContainer;

    if (isFunction(viewContainerProvider)) {
      viewContainerProvider = { provide: ViewContainer, useClass: viewContainerProvider };
    }

    return viewContainerProvider;
  }
}