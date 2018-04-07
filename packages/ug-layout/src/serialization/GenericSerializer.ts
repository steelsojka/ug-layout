import { PostConstruct } from '../di';
import { Serializer, Serialized, SerializerConfig } from './Serializer';
import { SerializerConstructor } from './SerializerContainer';
import { Renderable } from '../dom';
import { ConfigureableType } from '../common';
import { ConfiguredSerializer } from './ConfiguredSerializer';

export interface GenericSerializerConfig<R extends Renderable> extends SerializerConfig {
  name: string;
  type: ConfigureableType<R>;
}

/**
 * A serializer that can be used for renderables that don't container
 * any special logic or configuration.
 * @export
 * @class GenericSerializer
 * @implements {Serializer<R, Serialized>}
 * @template R The renderable type.
 */
export class GenericSerializer<R extends Renderable> extends Serializer<R, Serialized> {
  protected config: GenericSerializerConfig<R>;

  @PostConstruct()
  initialize(): void {
    if (!this.config) {
      throw new Error('GenericSerializer requires a config.');
    }
  }
  /**
   * Serializes the renderable.
   * @param {R} node
   * @returns {Serialized}
   */
  serialize(node: R): Serialized {
    return { name: this.config.name } ;
  }

  /**
   * Deserializes the node.
   * @param {Serialized} node
   * @returns {RenderableArg<R>}
   */
  deserialize(node: Serialized): any {
    return this.config.type;
  }

  static configure<R extends Renderable>(
    config: GenericSerializerConfig<R>
  ): ConfiguredSerializer<SerializerConstructor<GenericSerializer<R>>, GenericSerializerConfig<R>> {
    return new ConfiguredSerializer(this, config, container => {
      container.registerClass(config.name, config.type);
    });
  }
}