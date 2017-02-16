import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewComponent } from 'ug-layout';

@ViewComponent()
@Component({
  selector: 'test',
  template: `
    <div>
      <div *ngIf="show">Hello</div>
    </div>
  `
})
export class TestComponent {
  private _show: boolean = true;
  
  get show(): boolean {
    return this._show;
  }
  
  @Input() 
  set show(val: boolean) {
    this._show = val;
  }
  
  @Output() shown: EventEmitter<boolean> = new EventEmitter();

  constructor() {
    window['component'] = this;
  }
}