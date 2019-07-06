import { NgModule } from '@angular/core';

import { UgLayoutOutletComponent } from './UgLayoutOutlet.component';
import { UgLayoutDirective } from './UgLayout.directive';
import {
  UgLayoutRowDirective,
  UgLayoutColumnDirective
} from './UgLayoutRow.directive';
import { UgLayoutViewDirective } from './UgLayoutView.directive';

@NgModule({
  declarations: [
    UgLayoutOutletComponent,
    UgLayoutDirective,
    UgLayoutRowDirective,
    UgLayoutColumnDirective,
    UgLayoutViewDirective
  ],
  exports: [
    UgLayoutOutletComponent,
    UgLayoutDirective,
    UgLayoutRowDirective,
    UgLayoutViewDirective,
    UgLayoutColumnDirective
  ]
})
export class UgLayoutModule {}
