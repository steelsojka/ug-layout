import { Injector, Inject, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { RootLayout, Row, Layout, ConfiguredRenderable, Stack } from 'ug-layout';

import { TestComponent } from './Test.component';
import { AngularView } from '../../src';
import { Ng1TestComponent } from './Ng1Test.component';

@Component({
  selector: 'app',
  template: `
    <div class="app">
      <div>
        <button (click)="loadLayout(0)">Layout 1</button>
        <button (click)="loadLayout(1)">Layout 2</button>
      </div>
      <ug-layout-outlet [root]="root"></ug-layout-outlet>
    </div>
  `
})
export class AppComponent {
  root: ConfiguredRenderable<RootLayout>;
  layouts = [
    RootLayout.configure({
      use: Layout.configure({
        child: Row.configure({
          children: [{
            use: AngularView.configure({
              useClass: TestComponent
            })
          }, {
            use: AngularView.configure({
              useClass: Ng1TestComponent
            })
          }]
        })
      })
    }),
    RootLayout.configure({
      use: Layout.configure({
        child: Stack.configure({
          children: [{
            title: 'Test',
            use: Row.configure({
              children: [{
                use: AngularView.configure({
                  useClass: TestComponent
                })
              }, {
                use: AngularView.configure({
                  useClass: TestComponent
                })
              }]
            })
          }]
        })
      })
    })
  ]
  
  ngOnInit(): void {
    this.loadLayout(0);
  }

  loadLayout(index: number): void {
    this.root = this.layouts[index];
  }
}