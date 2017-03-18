import 'babel-polyfill';
import 'reflect-metadata';
import '../../src/styles/icons.css';
import '../../src/styles/core.css';
import '../../src/styles/theme-gl.css';
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
  BeforeDestroyEvent,
  DocumentRef,
  Injector,
  ViewConfig
} from '../../src';

const colors = [ 'red', 'blue', 'white', 'cyan', 'yellow' ];

class MyView extends View {
  initialize(): void {
    super.initialize();  

    const token = this.token;

    this._configuration = {
      token,
      useClass: OtherComponent
    };
  }

  static configure(config: ViewConfig): ConfiguredRenderable<MyView> {
    return new ConfiguredRenderable(MyView, config);
  }
}

@ViewComponent({
  cacheable: true
})
class OtherComponent {
  ugOnInit(container: ViewContainer<this>): void {
    container.mountHTML('<div>BAMFFFFFFFF</div>');
  }
}

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
    // console.log(dimensions);
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
          ref: 'View 1',
          useClass: TestView
        })
      }, {
        use: Layout.configure({
          child: Stack.configure({
            children: [{
              closeable: true,
              title: 'View 2',
              use: MyView.configure({ useClass: TestView, cacheable: false, ref: 'View 2' })  
            }, {
              title: 'View 3',
              use: View.configure({ useClass: TestView, ref: 'View 3' })  
            }, {
              title: 'View 4',
              use: View.configure({ useClass: TestView, ref: 'View 4' })  
            }, {
              title: 'View 5',
              use: View.configure({ useClass: TestView, ref: 'View 5' })  
            }, {
              title: 'View 6',
              use: View.configure({ lazy: true, useClass: TestView, ref: 'View 6' })  
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
            title: 'View 7',
            draggable: false,
            droppable: false,
            closeable: true,
            use: View.configure({ useClass: TestView, ref: 'View 7' })
          }]
        })
      }]
    })
  })
});

const rootLayout = window['rootLayout'] = RootLayout
  .create({
    container: document.body  
  });
  
  
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