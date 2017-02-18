import { 
  ReflectiveInjector, 
  ComponentFactoryResolver, 
  Injector, 
  ComponentRef, 
  Input
} from '@angular/core';
import { 
  ElementRef, 
  ViewFactory, 
  ViewContainer, 
  ViewFactoryArgs, 
  ViewConfig,
  ViewFactoriesRef,
  RootConfigRef,
  Inject
} from 'ug-layout';

import { AngularRootLayoutConfig } from './RootLayout';
import { 
  Angular1GlobalRef, 
  UgLayoutModuleConfiguration,
  COMPONENT_REF_KEY
} from './common';

export class AngularViewFactory extends ViewFactory {
  private _componentFactoryResolver: ComponentFactoryResolver;
  private _ngInjector: Injector;
  private _isInitialized: boolean = false;
  private _config: UgLayoutModuleConfiguration;

  constructor(
    @Inject(RootConfigRef) private _rootConfig: AngularRootLayoutConfig,
    @Inject(ViewFactoriesRef) _viewFactories: any
  ) {
    super(_viewFactories);
  }
  
  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    const { injector, config, element, container } = args;

    if (!this._isInitialized) {
      throw new Error('AngularViewFactory needs to be initialized prior to using');
    }

    return super.create<T>({
      injector, element, container,
      config: {
        token: this.getTokenFrom(config),
        useFactory: this._factory.bind(this, config),
        deps: [ ElementRef, ViewContainer ]
      }
    });
  }

  initialize(
    componentFactoryResolver: ComponentFactoryResolver,
    config: UgLayoutModuleConfiguration
  ) {
    this._componentFactoryResolver = componentFactoryResolver;
    this._config = config;
    this._isInitialized = true;
  }

  private async _factory<T>(config: ViewConfig, elementRef: HTMLElement, viewContainer: ViewContainer<T>): Promise<T> {
    const token = this.getTokenFrom(config);
    
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: ViewContainer, useValue: viewContainer }
    ], this._rootConfig.ngInjector);
    
    const componentRef = this._rootConfig.viewContainerRef.createComponent(
      componentFactory,
      undefined,
      injector
    );
    
    componentRef.instance[COMPONENT_REF_KEY] = componentRef;
    
    viewContainer.mount.subscribe(element => element.appendChild(componentRef.location.nativeElement));
    viewContainer.destroyed.subscribe(this._onComponentDestroy.bind(this, componentRef));

    // TODO: Add interceptor logic here

    componentRef.changeDetectorRef.detectChanges();
    
    return componentRef.instance;
  }

  private _onComponentDestroy<T>(componentRef: ComponentRef<T>): void {
    const index = this._rootConfig.viewContainerRef.indexOf(componentRef.hostView);
    
    if (index !== -1) {
      this._rootConfig.viewContainerRef.remove(index);
    }
  }
}

export function factory(
  componentFactoryResolver: ComponentFactoryResolver,
  viewFactories: Map<any, any>,
  config: UgLayoutModuleConfiguration
): any {
  return (viewFactories, rootConfig) => {
    const factory = new AngularViewFactory(rootConfig, viewFactories);
    
    factory.initialize(componentFactoryResolver, config);

    return factory;
  };
}

export const factoryDeps = [
  ViewFactoriesRef,
  RootConfigRef
];