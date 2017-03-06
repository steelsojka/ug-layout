import { ViewComponentConfig, ViewConfig, ViewFactoriesRef, ViewComponentRef, VIEW_CONFIG_KEY } from './common';
import { Injector, Inject, Optional, ProviderArg } from '../di';
import { View } from './View';
import { ViewContainer } from './ViewContainer';
import { ElementRef, ContainerRef } from '../common';
import { get } from '../utils';

export interface ViewFactoryArgs {
  config: ViewConfig;
  injector: Injector;
  container: View;
}

export type FactoryMap = Map<string, ViewFactory>;

export class ViewFactory {
  constructor(
    @Inject(ViewFactoriesRef) @Optional() protected _factories: FactoryMap|null
  ) {}
  
  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    const { config, injector, container } = args;
    const isLazy = this.resolveConfigProperty(config, 'lazy');
    
    const providers: ProviderArg[] = [
      { provide: ContainerRef, useValue: container },
      ViewContainer
    ];

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
        .takeUntil(viewContainer.visibilityChanges.filter(Boolean))
        .subscribe({ complete: () => viewContainer.initialize() });
    } else {
      viewContainer.initialize();
    }
     
    return viewContainer;
  }  

  getTokenFrom(config: ViewConfig): any {
    if (config.token) {
      return config.token;
    }
    
    if (config.useClass) {
      return config.useClass;
    } else if (config.useName) {
      this._assertFactoryExists(config.useName);
      
      return (<FactoryMap>this._factories).get(config.useName);
    } else if (config.useFactory) {
      return config.useFactory;
    } else if (config.useValue) {
      return config.useValue;
    }

    throw new Error('Can not resolve token from config.');
  }

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

  protected _assertFactoryExists(name: string): void {
    if (!this._factories) {
      throw new Error('There are no configured views.');
    }
    
    if (!this._factories.has(name)) {
      throw new Error(`${name} is not a configured view.`);
    }
  }
}