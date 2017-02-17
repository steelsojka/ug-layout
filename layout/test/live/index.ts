import 'babel-polyfill';
import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';
import { Observable } from 'rxjs/Rx';

import { 
  RootLayout, 
  Row, 
  Column, 
  Layout, 
  View, 
  Stack, 
  XYDirection,
  Inject,
  ViewContainer,
  ElementRef,
  ViewComponent,
  CancelAction,
  MinimizeStackControl
} from '../../src';

@ViewComponent()
class TestView {
  constructor(
    @Inject(ViewContainer) private container: ViewContainer<TestView>,
    @Inject(ElementRef) private element: HTMLElement
  ) {
    element.innerHTML = '<div>TEST!!</div>';
    (<any>window).testComp = this;

    container.visibilityChanges.subscribe(isVisible => console.log(isVisible));
    container.sizeChanges.subscribe(size => console.log(size));
  }
}

const rootLayout = RootLayout.create({
  container: document.body
})
  .configure({
    use: Layout.configure({
      child: Row.configure({
        children: [{
          use: Stack.configure({
            children: [{
              title: 'View 1',
              use: View.configure({
                useClass: TestView
              })
            }, {
              title: 'View 2',
              use: View.configure({
                useClass: TestView
              })
            }, {
              title: 'View 3',
              use: View.configure({
                useClass: TestView
              })
            }]
          })
        }]  
      })
    })
  })
  .initialize();
  

window.addEventListener('resize', () => {
  rootLayout.resize({
    height: window.innerHeight,
    width: window.innerWidth,
    x: 0,
    y: 0
  });
  
  rootLayout.update();
}, false);

(<any>window).rootLayout = rootLayout;