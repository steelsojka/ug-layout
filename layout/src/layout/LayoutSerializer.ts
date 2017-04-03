import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { SerializerContainer, Serializer, Serialized } from '../serialization';
import { Layout } from './Layout';

export interface SerializedLayout extends SerializedRenderable {
  child: Serialized;
}

/**
 * Serializes/deserializes a layout renderable.
 * @export
 * @class LayoutSerializer
 * @implements {Serializer<Layout, SerializedLayout>}
 */
export class LayoutSerializer implements Serializer<Layout, SerializedLayout> {
  /**
   * Creates an instance of LayoutSerializer.
   * @param {SerializerContainer} _container 
   */
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  /**
   * Serializes a Layout renderable.
   * @param {Layout} node 
   * @returns {SerializedLayout} 
   */
  serialize(node: Layout): SerializedLayout {
    return {
      name: 'Layout',
      tags: [ ...node.tags ],
      child: this._container.serialize(node.getChildren()[0])
    };
  }

  /**
   * Deserializes a serialized layout node.
   * @param {SerializedLayout} node 
   * @returns {ConfiguredRenderable<Layout>} 
   */
  deserialize(node: SerializedLayout): ConfiguredRenderable<Layout> {
    return Layout.configure({
      tags: [ ...node.tags ],
      child: this._container.deserialize(node.child)
    });
  }

  /**
   * Invoked when the serializer is registered.
   * @static
   * @param {SerializerContainer} container 
   */
  static register(container: SerializerContainer): void {
    container.registerClass('Layout', Layout);
  }
}