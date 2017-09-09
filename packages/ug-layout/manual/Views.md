Views
=====

Views are Renderables that know how to render a specific component. This is where we can integrate it into different frameworks. Let's use the following as our base example. I would read the Getting Started guide before diving in here.


#### Component

```
import { ViewComponent } from 'ug-layout';

@ViewComponent()
export class MyComponent {
  ugOnInit(container: ViewContainer): void {
    container.mountHTML('<div>Hello World!</div>');
  }
}
```

#### Layout

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
        }]
      })
    })
  })
)
```

View Container
--------------

The view container is a special object that manages how the component integrates with the view. It invokes hooks on the component, contains notification observables, and APIs for interacting with the layout framework. In the above example we are setting the content of the view with our components template. The view container also manages when the component is 'ready' allowing for components to resolve asynchronously.

### Async View Resolution

Views can have two async resolution phases. We can use a factory that returns a promise or we can use the `ugOnResolve` hook and return a promise.

#### Factory

```
View.configure({
  useFactory: async () => {
    const data = await service.fetchData();

    return myViewFactory(data); // Returns our component instance.
  }
});
```

#### ugOnResolve Hook

```
@ViewComponent()
class MyComponent {
  async ugOnResolve(): Promise<void> {
    this.data = await this.getData();    
  }

  ugOnInit(container: ViewContainer): void {
    // This won't be invoked until the data is fetched.
    container.mountHTML('<div>Hello World!</div>');
  }
}

View.configure({
  useClass: MyComponent
});
```

Component Lifecycle Hooks
-------------------------

These are hooks that get invoked during different points in the lifecycle of the view.

- ugOnResolve(container: ViewContainer) -> Invoked when the component is created, but before the `ugOnInit` hook. Can resolve async operations.
- ugOnInit(container: ViewContainer) -> Invoked when the component is ready and resolved.
- ugOnAttach(container: ViewContainer) -> Invoked when the ViewContainer is attached to it's View Renderable.
- ugOnDetach() -> Invoked when the ViewContainer is detached from it's View Renderable. This is useful for component caching.
- ugOnResize(dimensions: { width: number, height: number }) -> Invoked when the dimensions of the container change.
- ugOnVisibilityChange(isVisible: boolean) -> Invoked whenever this view becomes visible or hidden.
- ugOnBeforeDestroy(event: BeforeDestroyEvent) -> Invoked whenever the view is about to be destroyed. The event for this hook is cancellable or can wait on an async operation. This is useful for confirming before closing or halting the closing all together. Note, this is only fired during some destroy events (ex: Tab closing), not every time the view is destroyed.

View Component
--------------

The `ViewComponent` decorator is a special decorator used to define metadata for the view component. Many of the options for a view can be configured when configuring the view renderable as well.

```
@ViewComponent({
  lazy: true,
  cacheable: true
})
export class MyComponent {}

// These can be overriden upon each use of the component.

View.configure({
  useClass: MyComponent,
  lazy: false,
  cacheable: false
});
```

View Configuration
------------------

A view config has the following properties:

- `lazy: boolean` -> The view container won't be initialized until the view is visible for the first time. This also won't create the component until it is first shown or intialize is explicitly invoked on the ViewContainer.
- `cacheable: boolean` -> Whether the view container and it's component should NOT be destroyed when the View renderable is destroyed. This means you can use the same component instance across different layout configurations.
- `resolution: ResolverStrategy` -> How the view should be resolved with the ViewManager. See the section on `Resolver Strategies`.
- `token: any` -> The token to use to store this view with the {@link ViewManager}. If using `useClass` the constructor will be used as the token. If using a factory a `token` must be provided. This token is used to resolve configuration for the component as well. 
- `useFactory: Function` -> Use a factory to generate the component.
- `deps: any[]` -> Depenedencies to inject into the factory function. Only applies when using `useFactory` option.
- `useClass: Type<any>` -> A class that will be instantiated as the component. 
- `useValue: any` -> An already create component instance.
- `ref: string` -> A reference identifier. This is used to identify specific component references programmatically.

### Resolver Strategies

We can determine how a view gets resolved when it is created or asked for.

- `ResolverStrategy.TRANSIENT` -> Each time a view is requested to create a component, it will always create a new one.
- `ResolverStrategy.SINGLETON` -> Each time a view is requested to create a component, it will either return an existing instance of that component or create one that will be the single instance for that component.
- `ResolverStrategy.REF` -> Each time a view is requested to create a component, it will either return an existing instance of that component that matches the same ref identifier given or create one that will be registered under the given ref. Note, `ref` must be provided or else an error will be thrown.

Custom View Renderables
-----------------------

A {@link View} can be extended like any {@link Renderable} and can be integrated into any framework. Checkout the `ug-layout-angular` package for a View that renders Angular 1 and 2 components.