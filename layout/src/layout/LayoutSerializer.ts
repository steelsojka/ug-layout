import { ConfiguredRenderable } from '../dom';
import { Inject } from '../di';
import { SerializerContainer, Serializer, Serialized } from '../serialization';
import { Layout } from './Layout';

export interface SerializedLayout extends Serialized {
  child: Serialized;
}

export class LayoutSerializer implements Serializer<Layout, SerializedLayout> {
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  serialize(node: Layout): SerializedLayout {
    return {
      name: 'Layout',
      child: this._container.serialize(node.getChildren()[0])
    };
  }

  deserialize(node: SerializedLayout): ConfiguredRenderable<Layout> {
    return Layout.configure({
      child: this._container.deserialize(node.child)
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('Layout', Layout);
  }
}