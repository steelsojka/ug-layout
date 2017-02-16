import { NgModule, ComponentFactoryResolver, Injector } from '@angular/core';
import { RootInjector, ViewFactoriesRef } from 'ug-layout';

import { AngularViewFactory } from './AngularViewFactory';
import { angularRootInjectorFactory } from './AngularRootInjectorFactory';

@NgModule({
  providers: [{
    provide: RootInjector, 
    useFactory: angularRootInjectorFactory,
    deps: [ ComponentFactoryResolver, ViewFactoriesRef, Injector ]
  }, {
    provide: ViewFactoriesRef,
    useValue: new Map()
  }]  
})
export class UgLayoutModule {}