import { SerializerContainer, SerializerContainerConfig } from './serialization';

import { XYContainer, XYContainerSerializer } from './XYContainer';
import { LayoutSerializer, Layout } from './layout';
import { Stack, StackSerializer } from './stack';
import { RootLayout } from './RootLayout';
import { RootLayoutSerializer, SerializedRootLayout } from './RootLayoutSerializer';
import { View, ViewSerializer } from './view';
import { RootLayoutRef, RenderableArg } from './common';

export class RootSerializer extends SerializerContainer {
  constructor(config?: SerializerContainerConfig) {
    super(config);

    this.registerSerializer(XYContainer, XYContainerSerializer);
    this.registerSerializer(Layout, LayoutSerializer);
    this.registerSerializer(Stack, StackSerializer);
    this.registerSerializer(RootLayout, RootLayoutSerializer);
    this.registerSerializer(View, ViewSerializer);
  }  

  deserialize(serialized: SerializedRootLayout): RenderableArg<RootLayout> {
    return super.deserialize<RootLayout, SerializedRootLayout>(serialized);
  }

  serialize(root: RootLayout): SerializedRootLayout {
    return super.serialize<RootLayout, SerializedRootLayout>(root);
  }

  static fromRoot(rootLayout: RootLayout): RootSerializer {
    return new RootSerializer({
      injector: rootLayout.injector
    });
  }
}