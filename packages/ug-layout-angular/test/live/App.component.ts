import {
  Injector,
  Inject,
  Component,
  ViewChild,
  ViewContainerRef
} from '@angular/core';
import {
  RootLayout,
  Row,
  Layout,
  ConfiguredRenderable,
  Stack,
  DetachStackControl
} from 'ug-layout';

import { TestComponent } from './Test.component';
import { AngularView } from '../../src';
import { Ng1TestComponent } from './Ng1Test.component';

@Component({
  selector: 'app',
  template: `
    <div class="app">
      <ug-layout>
        <ug-layout-column>
          <ng-container *ugLayoutView="let viewContainer">
            <test [container]="viewContainer"></test>
          </ng-container>
          <ng-container *ugLayoutView>
            <test [show]="false"></test>
          </ng-container>
          <div *ugLayoutView>Some HTML</div>
        </ug-layout-column>
      </ug-layout>
    </div>
  `
})
export class AppComponent {}
