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
      <ug-layout-outlet
        [config]="config"
        [configFactory]="configFactory"
      ></ug-layout-outlet>
    </div>
  `
})
export class AppComponent {
  config = RootLayout.configure({
    use: Layout.configure({
      child: Stack.configure({
        children: [
          {
            title: 'Test 1',
            detachable: true,
            use: AngularView.configure({
              ref: 'test1',
              useClass: TestComponent
            })
          },
          {
            title: 'Test 2',
            use: AngularView.configure({
              ref: 'test2',
              useClass: TestComponent
            })
          }
        ]
      })
    })
  });

  configFactory(config) {
    return {
      ...config,
      detachUrl: '/detached.html'
    };
  }
}
