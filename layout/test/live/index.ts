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
  ConfiguredRenderable,
  ResolverStrategy,
  OnBeforeDestroy,
  BeforeDestroyEvent
} from '../../src';

const colors = [ 'red', 'blue', 'white', 'cyan', 'yellow' ];

@ViewComponent({
  cacheable: true,
  resolution: ResolverStrategy.REF
})
class TestView implements OnBeforeDestroy {
  private _color: string = colors.shift() as string;
  
  constructor(
    @Inject(ElementRef) private element: HTMLElement
  ) {
    (<any>window).testComp = this;

    element.innerHTML = '<div>TEST!!</div>';
    element.style.backgroundColor = this._color;
    // container.visibilityChanges.subscribe(isVisible => console.log(isVisible));
    // container.sizeChanges.subscribe(size => console.log(size));
  }

  ugOnBeforeDestroy(event: BeforeDestroyEvent<any>): void {
  }

  ugOnResize(dimensions): void {
    console.log(dimensions);
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
          cacheable: true,
          ref: 'Account Summary',
          useClass: TestView
        })
      }, {
        use: Layout.configure({
          child: Stack.configure({
            children: [{
              closeable: true,
              title: 'Account Positions',
              use: View.configure({ useClass: TestView, cacheable: false, ref: 'Account Positions' })  
            }, {
              title: 'Account Balances',
              use: View.configure({ useClass: TestView, ref: 'Account Balances' })  
            }, {
              title: 'Order Activity',
              use: View.configure({ useClass: TestView, ref: 'Order Activity' })  
            }, {
              title: 'Account Activity',
              use: View.configure({ useClass: TestView, ref: 'Account Activity' })  
            }, {
              title: 'Trade',
              use: View.configure({ useClass: TestView, ref: 'Trade' })  
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
            use: View.configure({ useClass: TestView, ref: 'Order Entry' })
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