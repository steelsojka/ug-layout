Configuring Renderables
=======================

ugLayout uses the `ConfiguredRenderable` class as a way to associate configuration between a Renderable and it's configuration. Most built in renderables contain static method named `configure`. This method returns a `ConfiguredRenderable` instance that contains the provided config and Renderable class.

```
Layout.configure({
  child: Row
});

// Is equal to

new ConfiguredRenderable(Layout, {
  child: Row
})
```

Anywhere something requires a `RenderableArg` You can provide a Renderable, a `ConfiguredRenderable` or an instance of a Renderable.

Resolving Renderables and Configuration
---------------------------------------

If you are creating Renderables from a `RenderableArg` you can use the `resolve` and `resolveConfiguration` static methods on the `ConfiguredRenderable` class to resolve them.

```
const layoutConfig = Layout.configure({ child: Row });
const layoutInstance = new Layout();

ConfiguredRenderable.resolve(layoutConfig); // => Layout
ConfiguredRenderable.resolve(Layout); // => Layout
ConfiguredRenderable.resolve(layoutInstance); // => Layout

ConfiguredRenderable.resolveConfiguration(layoutConfig); // => { child: Row }
```