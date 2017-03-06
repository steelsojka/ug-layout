import {
  NgModule,
  Injector,
  ApplicationRef
} from '@angular/core';

import { RootLayoutProviders, AngularInjectorRef } from './common';
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
    useFactory: ngInjector => {
      return [
        { provide: AngularInjectorRef, useValue: ngInjector }
      ]
    },
    deps: [ Injector ]
  }]
})
export class UgLayoutModule {}