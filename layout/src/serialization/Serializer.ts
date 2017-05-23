import { Token, Inject, Optional } from '../di';
import { Renderable, RenderableConfig } from '../dom';
import { RenderableConstructorArg } from '../common';
import { isObject, isFunction } from '../utils';
import { SerializerContainer } from './SerializerContainer';
import { ConfiguredItem } from '../ConfiguredItem';

export const SERIALIZER_CONFIG = new Token<any>('SERIALIZER_CONFIG');

export interface SerializerConfig {
  exclude?: string[];
  always?: { [key: string]: any };
}

export interface Serialized {
  name: string;
}

export abstract class Serializer<R extends Renderable, S extends Serialized> {
  @Inject(SerializerContainer) protected container: SerializerContainer;

  @Inject(SERIALIZER_CONFIG)
  @Optional() 
  protected config: SerializerConfig | null;

  abstract serialize(node: R): S; 
  abstract deserialize(serialized: S): RenderableConstructorArg<R>;

  postDeserialized(serialized: S, node: RenderableConstructorArg<R>): RenderableConstructorArg<R> {
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

    return serialized;
  }

  exclude(node: R): boolean {
    return false;
  }

  static configure<T extends typeof Serializer>(config: SerializerConfig): ConfiguredItem<T, SerializerConfig> {
    return new ConfiguredItem(this as T, config);
  }
}