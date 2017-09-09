import { Directive, Input } from '@angular/core';
import { RenderableConfig } from 'ug-layout';

@Directive({
  selector: 'ug-layout-item'
})
export class UgLayoutItemDirective {
  @Input() config: RenderableConfig;
}