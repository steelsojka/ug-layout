import 'babel-polyfill';
import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';

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
  ElementRef
} from '../../src';

class TestView {
  constructor(
    @Inject(ViewContainer) container: ViewContainer,
    @Inject(ElementRef) element: HTMLElement
  ) {
    console.log(container, element);
  }
}

const rootLayout = RootLayout.create({
  container: document.body
})
  .configure({
    use: Layout.configure({
      child: Stack.configure({
        startIndex: 1,
        children: [{
          use: Row.configure({
            children: [{
              use: View.configure({
                injectable: true,
                factory: TestView
              })
            }, {
              use: View
            }, {
              use: View
            }]
          }),
          title: 'Test View 1'
        }, {
          use: Stack.configure({
            direction: XYDirection.Y,
            header: {
              size: 100
            },
            children: [{
              title: 'NESTED 1',
              use: Column.configure({
                children: [{
                  use: View
                }, {
                  use: View
                }]
              })
            }, {
              use: View,
              title: 'NESTED 2'
            }]
          }),
          title: 'Test View 2'
        }]  
      })
    })
  })
  .initialize();
  

window.addEventListener('resize', () => {
  rootLayout.resize({
    height: window.innerHeight,
    width: window.innerWidth
  });
  
  rootLayout.update();
}, false);

(<any>window).rootLayout = rootLayout;