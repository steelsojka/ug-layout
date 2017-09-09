Serialization
=============

ugLayout supports serializing a layout's state as JSON that can be stored and read back into a layout. Usually each Renderable has a Serializer associated with it. Let's dive in to serialization basic usage.

Usage
-----

We need to create a SerializerContainer from our root layout. We can use the RootSerializer class which is a SerializerContainer bootstrapped with all the built in Renderables registered.

```
const rootLayout = RootLayout.create({ container: document.body });

class MyComponent {}

rootLayout.load(
  RootLayout.configure({
    child: Layout.configure({
      child: View.configure({ useClass: MyComponent })
    })
  })
);
```

Let's assume we have the root layout instance above. Now we can create out serializer.

```
import { RootSerializer } from 'ug-layout';

const serializer = RootSerializer.fromRoot(rootLayout);
const layoutJSON = serializer.serialize(rootLayout);
```

Not we can store this JSON into LocalStorage or any other storage. Now we'll load the root layout from the JSON.

```
rootLayout.load(serializer.deserialize(layoutJSON));

```

The `deserialize` method returns a `ConfiguredRenderable` which is the same as calling `RootLayout.configure()`.

Creating Serializers
--------------------

Each Renderable is not essential a 1 to 1 relation ship but in a lot of cases it is. For example the `Layout` Renderable has a `LayoutSerializer` which knows how to serialize and deserialize a Layout Renderable. A `Stack` has a single `StackSerializer`, but it also serializes and deserializes `StackHeader`, `StackTab`, and `StackItemContainer` since they are only applicable to Stacks.

A serializer need to implement the `Serializer` interface. Here is an example serializer.

```
import {
  Serializer,
  Serialized,
  ConfiguredRenderable,
  SerializerContainer
} from 'ug-layout';

import { MyRenderable } from './MyRenderable';

export interface SerializedMyRenderable extends Serialized {
  someMessage: string;
}

export class MySerializer implements Serializer<MyRenderable, SerializeMyRenderable> {
  serialize(renderable: MyRenderable): SerializedMyRenderable {
    return {
      name: 'MyRenderable',
      someMessage: renderable.someMessage
    };
  }
  
  deserialize(serialized: SerializedMyRenderable): ConfiguredRenderable<MyRenderable> {
    return new ConfiguiredRenderable(MyRenderable, {
      someMessage: serialized.someMessage
    });
  }
  
  static register(container: SerializerContainer): void {
    container.registerClass('MyRenderable', MyRenderable);
  }
}
```