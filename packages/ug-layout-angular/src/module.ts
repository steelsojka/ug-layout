import {
  NgModule,
  Injector,
  ApplicationRef
} from '@angular/core';

import { UgLayoutOutletComponent } from './UgLayoutOutlet.component';
import { UgLayoutDirective } from './UgLayout.directive';
import { UgLayoutRowDirective } from './UgLayoutRow.directive';
import { UgLayoutViewDirective } from './UgLayoutView.directive';

@NgModule({
  declarations: [
    UgLayoutOutletComponent,
    UgLayoutDirective,
    UgLayoutRowDirective,
    UgLayoutViewDirective
  ],
  exports: [
    UgLayoutOutletComponent,
    UgLayoutDirective,
    UgLayoutRowDirective,
    UgLayoutViewDirective
  ]
})
export class UgLayoutModule {}