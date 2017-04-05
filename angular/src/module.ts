import {
  NgModule,
  Injector,
  ApplicationRef
} from '@angular/core';

import { UgLayoutOutletComponent } from './UgLayoutOutlet.component';

@NgModule({
  declarations: [
    UgLayoutOutletComponent
  ],
  exports: [
    UgLayoutOutletComponent
  ]
})
export class UgLayoutModule {}