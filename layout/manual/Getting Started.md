Getting Started
===============

We always start by creating a `RootLayout`.

```
import { RootLayout } from 'ug-layout';

const root = RootLayout.create({
  container: document.body // This can be any HTMLElement
});
```

Not that we have a root layout all we need to do is configure the renderable tree.
For configuring renderables refer to the configuration section of the docs.


```
import { RootLayout, Layout, Row, View } from 'ug-layout';

const root = RootLayout.create({
  container: document.body
});

root.load(
  RootLayout.configure({
    child: Layout.configure({
      child: Row
    })
  })
)
```

The above will create a layout with a single row. We haven't configured any renderables
to occupy that row yet. This is where `Views` come into play. Views are Renderables
that render a component that we create. We can use factories, classes, or already existing instances.
Read the configuration for the {@link View} Renderable for more information.

Let's create a basic component we want to render.

```
export class MyComponent {
  // This hook gets fired when the component is initialized.
  ugOnInit(container: ViewContainer): void {
    container.mountHTML('<div>Hello World!</div>');
  }
}
```

The `ViewContainer` is an object that contains the component instance. It's the link
between your component and the layout framework. This seperation allows for the framework to be
transparent to the component. You only need to expose hooks on your component.

So no that our component is created lets hook it up.

```
import { RootLayout, Layout, Row, View } from 'ug-layout';

import { MyComponent } from './MyComponent';

const root = RootLayout.create({
  container: document.body
});

root.load(
  RootLayout.configure({
    child: Layout.configure({
      child: Row.configure({
        children: [{
          use: View.configure({
            useClass: MyComponent
          })
        }, {
          use: View.configure({
            useClass: MyComponent
          })
        }]
      })
    })
  })
)
```

So, from this example we have a layout with a row that will render two instances of `MyComponet`. This all the configuration needed. This may seem a little verbose at first but this allows for any number of combinations of `Renderables`. Since this framework is completely extensible we can create adapters into any frameworks rendering and component engine. For example `ug-layout-angular` will render Angular 2 and Angular 1 components.