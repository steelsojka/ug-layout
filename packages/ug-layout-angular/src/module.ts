import { NgModule } from '@angular/core';

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