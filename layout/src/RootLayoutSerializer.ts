import { ConfiguredRenderable } from './dom';
import { Inject } from './di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from './serialization';
import { RootLayout } from './RootLayout';
import { RenderableArg } from './common';
import { Layout } from './layout';

export interface SerializedRootLayout extends Serialized {
  use: Serialized; 
}

export class RootLayoutSerializer implements Serializer<RootLayout, SerializedRootLayout> {
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  serialize(node: RootLayout): SerializedRootLayout {
    return {
      name: 'RootLayout',
      use: this._container.serialize(node.getChildren()[0])
    };
  }

  deserialize(node: SerializedRootLayout): ConfiguredRenderable<RootLayout> {
    return RootLayout.configure({
      use: this._container.deserialize(node.use) as RenderableArg<Layout>
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('RootLayout', RootLayout);
  }
}