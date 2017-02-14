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
      child: Stack.configure({
        startIndex: 1,
        children: [{
          use: Row.configure({
            children: [{
              use: Row
            }, {
              use: Row
            }, {
              use: Row
            }]
          }),
          title: 'Test View 1'
        }, {
          use: Stack.configure({
            children: [{
              title: 'NESTED 1',
              use: Column.configure({
                children: [{
                  fixed: true,
                  use: Stack.configure({
                    header: {
                      controls: [{
                        use: MinimizeStackControl
                      }]  
                    },
                    children: [{
                      title: 'Account Summary',
                      use: View.configure({
                        useClass: TestView
                      })
                    }]
                  })
                }, {
                  use: Row
                }, {
                  minSizeY: 300,
                  use: Stack.configure({
                    header: {
                      controls: [{
                        use: MinimizeStackControl
                      }]  
                    },
                    children: [{
                      title: 'Order Entry',
                      use: View.configure({
                        useClass: TestView
                      })
                    }]  
                  })
                }]
              })
            }, {
              use: Row,
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
    width: window.innerWidth,
    x: 0,
    y: 0
  });
  
  rootLayout.update();
}, false);

(<any>window).rootLayout = rootLayout;