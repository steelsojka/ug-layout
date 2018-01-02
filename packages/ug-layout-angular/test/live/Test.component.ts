import { Inject, Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewComponent, ViewContainer } from 'ug-layout';

import { Detect } from '../../src/decorators';

@ViewComponent({
  cacheable: true
})
@Component({
  selector: 'test',
  template: `
    <div>
      <div *ngIf="show">{{ number }}</div>
    </div>
  `
})
export class TestComponent {
  private _show: boolean = true;
  private number: number = Math.random();

  @Detect() test: number = 0;

  constructor(
    @Inject(ViewContainer) private _viewContainer: ViewContainer<TestComponent>
  ) { 
    window['component'] = this;
  }
  
  get show(): boolean {
    return this._show;
  }
  
  @Detect()
  @Input() 
  set show(val: boolean) {
    this._show = val;
  }
  
  @Output() shown: EventEmitter<boolean> = new EventEmitter();
}