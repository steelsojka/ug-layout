import { Component } from '@angular/core';
import { ViewComponent } from 'ug-layout';

@ViewComponent()
@Component({
  selector: 'test',
  template: `
    <div>This is my test component!</div>
  `
})
export class TestComponent {}