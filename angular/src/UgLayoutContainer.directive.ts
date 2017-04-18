import { 
  Directive, 
  forwardRef, 
  ContentChildren, 
  Input,
  QueryList,
  AfterContentInit
} from '@angular/core';
import { RootLayout } from 'ug-layout';

import { UgLayoutItemDirective } from './UgLayoutItem.directive';

@Directive({
  selector: 'ug-layout-container'
})
export class UgLayoutContainerDirective implements AfterContentInit {
  @ContentChildren(UgLayoutItemDirective)
  items: QueryList<UgLayoutItemDirective>;

  ngAfterContentInit(): void {
    console.log(this.items);
  }
}