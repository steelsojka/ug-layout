import 'babel-polyfill';
import 'reflect-metadata';
import './index.css';

import {
  RootLayout,
  Column,
  Layout,
  View,
  Stack,
  Inject,
  ViewContainer,
  ElementRef,
  ViewComponent,
  MinimizeStackControl,
  StackControlPosition,
  RootSerializer,
  ConfiguredRenderable,
  ResolverStrategy,
  BeforeDestroyEvent,
  ViewConfig
} from '../../src';

const colors = [ 'red', 'blue', 'white', 'cyan', 'yellow' ];

@ViewComponent()
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

@ViewComponent()
class OtherComponent {
  ugOnInit(container: ViewContainer<this>): void {
    container.mountHTML('<div>BAMFFFFFFFF</div>');
  }
}

@ViewComponent()
class TextComponent {
  ugOnInit(container: ViewContainer<this>): void {
    container.mountHTML('<div><input type="text" /></div>');
    container.windowChanges.subscribe(win => console.log(win));
  }
}

@ViewComponent({
  resolution: ResolverStrategy.REF
})
class TestView {
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
          ref: 'View 1',
          useClass: TestView
        })
      }, {
        use: Layout.configure({
          child: Stack.configure({
            children: [{
              closeable: true,
              title: 'View 2',
              detachable: true,
              use: View.configure({ useClass: TestView, ref: 'View 2' })
            }, {
              title: 'View 3',
              detachable: true,
              use: View.configure({ useClass: TestView, ref: 'View 3' })
            }, {
              title: 'View 4',
              detachable: true,
              use: View.configure({ useClass: TextComponent, ref: 'View 4' })
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
    container: document.body,
    detachUrl: '/detached.html'
  });


const serializer = RootSerializer.fromRoot(rootLayout);

serializer.registerClasses({
  TestView,
  MyView,
  OtherComponent,
  TextComponent
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