import { PostConstruct } from '../di';
import { Serializer, Serialized } from './Serializer';
import { SerializerContainer } from './SerializerContainer';
import { Renderable, RenderableConfig } from '../dom';
import { RenderableConstructorArg, ConfigureableType } from '../common';
import { ConfiguredItem } from '../ConfiguredItem';

export interface GenericSerializerConfig<R extends Renderable> {
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

  /**
   * Registers this class with the container.
   * @param {SerializerContainer} container 
   */
  register(container: SerializerContainer): void {
    container.registerClass(this.config.name, this.config.type);
  }

  static configure<R extends Renderable>(config: GenericSerializerConfig<R>): ConfiguredItem<typeof GenericSerializer, GenericSerializerConfig<R>> {
    return new ConfiguredItem(GenericSerializer, config);
  }
}