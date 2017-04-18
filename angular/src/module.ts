import {
  NgModule,
  Injector,
  ApplicationRef
} from '@angular/core';

import { UgLayoutOutletComponent } from './UgLayoutOutlet.component';
import { UgLayoutContainerDirective } from './UgLayoutContainer.directive';
import { UgLayoutItemDirective } from './UgLayoutItem.directive';

@NgModule({
  declarations: [
    UgLayoutOutletComponent,
    UgLayoutItemDirective,
    UgLayoutContainerDirective
  ],
  exports: [
    UgLayoutOutletComponent,
    UgLayoutItemDirective,
    UgLayoutContainerDirective
  ]
})
export class UgLayoutModule {}