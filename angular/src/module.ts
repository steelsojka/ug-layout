import { 
  Provider, 
  NgModule, 
  ComponentFactoryResolver, 
  Injector, 
  ModuleWithProviders,
  Type,
  ApplicationRef
} from '@angular/core';
import { RootInjector, ViewFactoriesRef } from 'ug-layout';

import { angularRootInjectorFactory } from './AngularRootInjectorFactory';
import { RootLayoutProviders, UgLayoutModuleConfigRef, UgLayoutModuleConfiguration } from './common';
import { UgLayoutOutletComponent } from './UgLayoutOutlet.component';

@NgModule({
  declarations: [
    UgLayoutOutletComponent
  ],
  exports: [
    UgLayoutOutletComponent
  ],
  providers: [{
    provide: RootLayoutProviders, 
    useFactory: angularRootInjectorFactory,
    deps: [
      ComponentFactoryResolver, 
      ViewFactoriesRef, 
      Injector,
      UgLayoutModuleConfigRef
    ]
  }, {
    provide: UgLayoutModuleConfigRef,
    useValue: {}
  }]  
})
export class UgLayoutModule {
  static forRoot(config: UgLayoutModuleConfiguration): ModuleWithProviders {
    return {
      providers: [
        { provide: UgLayoutModuleConfigRef, useValue: config },
        { provide: ViewFactoriesRef, useValue: config.factories || new Map() }
      ],
      ngModule: UgLayoutModule
    };
  }
}