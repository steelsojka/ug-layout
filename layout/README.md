(U)ltra (G)oodness Layout
=========================

ugLayout is a perfomant, highly extensible framework for making configureable layouts with components.

Concepts
--------

ugLayout is a tree of **Renderable** objects. A row is a renderable object and so are all items belonging to that row. ugLayout comes with the built in Renderables:

- Stack (Tabbable container)
- Row
- Column
- Layout (A scoped container)
- View (Creates components)

Install
-------

`npm install --save ug-layout`

Basic Useage
------------

```
import { RootLayout, Layout, Column } from 'ug-layout';

// The configuration for the layout (tree of Renderables)
const configuration = RootLayout.configure({
  child: Layout.configure({
    child: Column  
  })
});

// Creates the root alyout instance.
const layout = RootLayout.create({
  container: documentk.body
});

// Load the configuration
layout.load(configuration);
```

The example above will render the layout into the container element. This example is the most BASIC example. Please resort to the manual for more complex scenarios.
