import { ComponentFactoryResolver, Injector as NgInjector, ApplicationRef } from '@angular/core';
import { 
  RootInjector, 
  Injector, 
  ViewFactory, 
  ViewFactoriesRef,
  ProviderArg
} from 'ug-layout';

import { AngularViewFactory, factory, factoryDeps } from './AngularViewFactory';
import { UgLayoutModuleConfigRef, UgLayoutModuleConfiguration } from './common';

export function angularRootInjectorFactory(
  componentFactoryResolver: ComponentFactoryResolver,
  viewFactories: Map<any, any>,
  ngInjector: NgInjector,
  moduleConfig: UgLayoutModuleConfiguration
): ProviderArg[] {
  return [
    { provide: ViewFactoriesRef, useValue: viewFactories },
    { 
      provide: ViewFactory, 
      useFactory: factory(
        componentFactoryResolver,
        viewFactories,
        moduleConfig,
        ngInjector
      ),
      deps: factoryDeps
    }
  ];
}