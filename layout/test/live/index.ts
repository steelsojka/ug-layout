import 'babel-polyfill';
import 'reflect-metadata';
import '../../src/styles/icons.css';
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
  MinimizeStackControl,
  StackControlPosition,
  RootSerializer,
  ConfiguredRenderable
} from '../../src';

const colors = [ 'red', 'blue', 'white', 'cyan', 'yellow' ];

@ViewComponent()
class TestView {
  private _color: string = colors.shift() as string;
  
  constructor(
    @Inject(ViewContainer) private container: ViewContainer<TestView>,
    @Inject(ElementRef) private element: HTMLElement
  ) {
    (<any>window).testComp = this;

    element.innerHTML = '<div>TEST!!</div>';
    element.style.backgroundColor = this._color;
    container.visibilityChanges.subscribe(isVisible => console.log(isVisible));
    container.sizeChanges.subscribe(size => console.log(size));
  }
}
  
window.addEventListener('resize', () => {
  rootLayout.resize({
    height: window.innerHeight,
    width: window.innerWidth,
    x: 0,
    y: 0
  });
  
  rootLayout.update();
}, false);

const initialLayout = RootLayout.configure({
  use: Layout.configure({
    child: Column.configure({
      children: [{
        use: View.configure({
          useClass: TestView
        })
      }, {
        use: Layout.configure({
          child: Stack.configure({
            children: [{
              closeable: true,
              title: 'Account Positions',
              use: View.configure({ useClass: TestView })  
            }, {
              title: 'Account Summary',
              use: View.configure({ useClass: TestView })  
            }, {
              title: 'Order Activity',
              use: View.configure({ useClass: TestView })  
            }, {
              title: 'Account Activity',
              use: View.configure({ useClass: TestView })  
            }, {
              title: 'Trade',
              use: View.configure({ useClass: TestView })  
            }]
          })
        })
      }, {
        minSizeY: 200,
        use: Stack.configure({
          controls: [
            MinimizeStackControl.configure({
              position: StackControlPosition.PRE_TAB
            })
          ],
          children: [{
            title: 'Order Entry',
            draggable: false,
            droppable: false,
            closeable: true,
            use: View.configure({ useClass: TestView })
          }]
        })
      }]
    })
  })
});

const rootLayout = window['rootLayout'] = RootLayout
  .create({
    container: document.body  
  })
  .initialize();
  
const serializer = RootSerializer.fromRoot(rootLayout);

serializer.registerClasses({
  TestView
});

rootLayout.load(initialLayout);

window['layouts'] = {};

function saveLayout(name: string): void {
  window['layouts'][name] = serializer.serialize(rootLayout);
}

function loadLayout(name: string): void {
  if (window['layouts'][name]) {
    rootLayout.load(serializer.deserialize(window['layouts'][name]) as ConfiguredRenderable<RootLayout>);
  }
}

window['saveLayout'] = saveLayout;
window['loadLayout'] = loadLayout;