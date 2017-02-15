import { ComponentFactoryResolver, Injector as NgInjector } from '@angular/core';
import { 
  RootInjector, 
  Injector, 
  ViewFactory, 
  ViewFactoriesRef
} from 'ug-layout';

import { AngularViewFactory } from './AngularViewFactory';

export function angularRootInjectorFactory(
  componentFactoryResolver: ComponentFactoryResolver,
  viewFactories: Map<any, ViewFactory>,
  ngInjector: NgInjector 
): Injector {
  return new RootInjector([
    { provide: ViewFactoriesRef, useValue: viewFactories },
    {
      provide: ViewFactory, 
      useFactory: viewFactories => {
        const factory = new AngularViewFactory(viewFactories);
        
        factory.initialize(componentFactoryResolver, ngInjector);

        return factory;
      },
      deps: [ ViewFactoriesRef ]
    }
  ]);
}