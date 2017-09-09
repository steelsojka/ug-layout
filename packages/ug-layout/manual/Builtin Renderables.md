Builtin Renderables
===================

Here is a list of builtin renderables.

Row
---

A row renders a list of Renderables horizontally.

Column
------

A column renders a list of Renderables vertically.

Stack
-----

A stack renders a list of Renderables as a tabbable interface. If the tab is configured with headers the tabs can be dropped onto other stacks.

Layout
------

A layout is a grouping that contains Renderables underneath it. Visually it does nothing, but it contains it's own `DragHost` which restricts items from being dragged outside it's bounds. If you want keep a Stack item from being dragged out side a set of Renderables then you would use a Layout to contain it.

RootLayout
----------

This is the root layout that is created and bootstraps all dependencies for child renderables.

View
----

Renders components and interfaces with a ViewContainer.