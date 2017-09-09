import { 
  Directive, 
  forwardRef, 
  ContentChildren, 
  Input,
  QueryList,
  AfterContentInit,
  InjectionToken
} from '@angular/core';
import {
  RootLayout,

} from 'ug-layout';

import { UgLayoutItemDirective } from './UgLayoutItem.directive';

export const PARENT_CONTAINER = new InjectionToken<UgLayoutContainerDirective>('PARENT_CONTAINER');

@Directive({
  selector: 'ug-layout-container',
  providers: [
    { provide: PARENT_CONTAINER, useExisting: forwardRef(() => UgLayoutContainerDirective) }
  ]
})
export class UgLayoutContainerDirective implements AfterContentInit {
  @ContentChildren(UgLayoutItemDirective)
  items: QueryList<UgLayoutItemDirective>;

  ngAfterContentInit(): void {
    console.log(this.items);
  }
}