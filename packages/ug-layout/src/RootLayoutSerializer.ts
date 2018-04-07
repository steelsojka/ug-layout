import { ConfiguredRenderable } from './dom';
import { SerializerContainer, Serializer, Serialized } from './serialization';
import { RootLayout } from './RootLayout';
import { RenderableArg } from './common';
import { Layout } from './layout';

export interface SerializedRootLayout extends Serialized {
  use: Serialized;
}

export class RootLayoutSerializer extends Serializer<RootLayout, SerializedRootLayout> {
  serialize(node: RootLayout): SerializedRootLayout {
    return {
      name: 'RootLayout',
      use: this.container.serialize(node.getChildren()[0])
    };
  }

  deserialize(node: SerializedRootLayout): ConfiguredRenderable<RootLayout> {
    return RootLayout.configure({
      use: this.container.deserialize(node.use) as RenderableArg<Layout>
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('RootLayout', RootLayout);
  }
}