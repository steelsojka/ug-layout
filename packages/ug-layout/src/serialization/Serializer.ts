import { Token, Inject, Optional } from '../di';
import { Renderable, RenderableConfig, ConfiguredRenderable } from '../dom';
import { RenderableConstructorArg } from '../common';
import { SerializerContainer, BaseSerializerArg, SerializerConstructor } from './SerializerContainer';
import { ConfiguredSerializer } from './ConfiguredSerializer';

export const SERIALIZER_CONFIG = new Token<any>('SERIALIZER_CONFIG');

export interface SerializerConfig {
  exclude?: string[];
  always?: { [key: string]: any };
}

export interface Serialized {
  name: string;
  serializer?: SerializedSerializerConfig;
}

export interface SerializedSerializerConfig extends Serialized, SerializerConfig {}

export abstract class Serializer<R extends Renderable, S extends Serialized> {
  @Inject(SerializerContainer) protected container: SerializerContainer;

  @Inject(SERIALIZER_CONFIG)
  @Optional()
  protected config: SerializerConfig | null;

  abstract serialize(node: R): S;
  abstract deserialize(serialized: S): RenderableConstructorArg<R>;

  postDeserialized(serialized: S, node: RenderableConstructorArg<R>): RenderableConstructorArg<R> {
    if (node instanceof ConfiguredRenderable) {
      const config = ConfiguredRenderable.resolveConfiguration(node) as RenderableConfig;
      const renderableClass = ConfiguredRenderable.resolve(node);

      if (serialized.serializer) {
        const serializerClass = this.container.resolveClass(serialized.serializer.name) as typeof Serializer | null;

        if (serializerClass) {
          return new ConfiguredRenderable(renderableClass, {
            ...config,
            serializer: serializerClass.configure(serialized.serializer)
          });
        }
      }
    }

    return node;
  }

  postSerialized(node: R, serialized: S): S {
    if (this.config) {
      if (this.config.exclude) {
        for (const key of this.config.exclude) {
          delete serialized[key];
        }
      }

      if (this.config.always) {
        for (const key of Object.keys(this.config.always)) {
          serialized[key] = this.config.always[key];
        }
      }
    }

    const nodeSerializer = node.getSerializer();

    if (nodeSerializer) {
      serialized.serializer = Serializer.resolveAndSerialize(nodeSerializer);
    }

    return serialized;
  }

  getConfig(): SerializerConfig | null {
    return this.config;
  }

  exclude(node: R): boolean {
    return false;
  }

  static resolve(serializer: BaseSerializerArg): { config: SerializerConfig | null, type: typeof Serializer } {
    if (serializer instanceof ConfiguredSerializer) {
      return {
        config: ConfiguredSerializer.resolveConfig(serializer),
        type: ConfiguredSerializer.resolveItem<typeof Serializer>(serializer)
      };
    }

    if (serializer instanceof Serializer) {
      return {
        config: serializer.getConfig(),
        type: serializer.constructor as typeof Serializer
      };
    }

    return { config: null, type: serializer };
  }

  static resolveAndSerialize(serializer: BaseSerializerArg): SerializedSerializerConfig {
    const { config, type } = this.resolve(serializer);

    return {
      ...config,
      name: type.name
    };
  }

  static configure(config: any): ConfiguredSerializer<any, any> {
    return new ConfiguredSerializer(this as any, config, container => this.register(container));
  }

  static register(container: SerializerContainer): void {
    container.registerClass(this.name, this as any);
  }
}