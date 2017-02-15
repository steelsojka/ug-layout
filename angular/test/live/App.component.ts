import { Inject, Component, ViewChild, ViewContainerRef } from '@angular/core';
import { Layout, ConfiguredRenderable, RootLayout, View, Stack, RootInjector } from 'ug-layout';

import { TestComponent } from './Test.component';

@Component({
  selector: 'app',
  template: '<div #main class="app"></div>'
})
export class AppComponent {
  @ViewChild('main', { read: ViewContainerRef } ) 
  containerRef: ViewContainerRef;

  constructor(
    @Inject(RootInjector) private _rootInjector: RootInjector
  ) { 
    console.log(_rootInjector);
  }
  
  ngOnInit(): void {
    RootLayout
      .create({
        container: this.containerRef.element.nativeElement,
        injector: this._rootInjector
      })
      .configure({
        use: Layout.configure({
          child: Stack.configure({
            children: [{
              title: 'Test',
              use: View.configure({
                useClass: TestComponent
              })
            }]
          })
        })
      })
      .initialize();
  }
}