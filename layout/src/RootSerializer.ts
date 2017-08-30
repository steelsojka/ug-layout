import { SerializerContainer, GenericSerializer } from './serialization';

import { Inject, Injector, PostConstruct } from './di';
import { 
  XYContainer, 
  XYContainerSerializer, 
  XYItemContainer, 
  XYItemContainerSerializer,
  XY_ITEM_CONTAINER_CLASS
} from './XYContainer';
import { LayoutSerializer, Layout } from './layout';
import { 
  Stack, 
  StackSerializer,
  STACK_CLASS
} from './stack';
import { NoopRenderable } from './noop';
import { RootLayout } from './RootLayout';
import { RootLayoutSerializer, SerializedRootLayout } from './RootLayoutSerializer';
import { View, ViewSerializer } from './view';
import { RenderableConstructorArg } from './common';

export class RootSerializer extends SerializerContainer {
  @Inject(STACK_CLASS) private _Stack: typeof Stack;
  @Inject(XY_ITEM_CONTAINER_CLASS) private _XYItemContainer: typeof XYItemContainer;

  constructor(@Inject(Injector) injector: Injector) {
    super({ injector });
  }  

  @PostConstruct()
  initialize(): void {
    this.registerSerializer(XYContainer, XYContainerSerializer);
    this.registerSerializer(Layout, LayoutSerializer);
    this.registerSerializer(this._Stack, StackSerializer);
    this.registerSerializer(RootLayout, RootLayoutSerializer);
    this.registerSerializer(View, ViewSerializer);
    this.registerSerializer(this._XYItemContainer, XYItemContainerSerializer);
    this.registerSerializer(NoopRenderable, GenericSerializer.configure({ name: 'NoopRenderable', type: NoopRenderable }));
  }

  deserialize(serialized: SerializedRootLayout): RenderableConstructorArg<RootLayout> {
    return super.deserialize<RootLayout, SerializedRootLayout>(serialized);
  }

  serialize(root: RootLayout): SerializedRootLayout {
    return super.serialize<RootLayout, SerializedRootLayout>(root);
  }

  static fromRoot(rootLayout: RootLayout): RootSerializer {
    return rootLayout.injector.resolveAndInstantiate<RootSerializer>(RootSerializer);
  }
}