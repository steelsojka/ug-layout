import { ConfiguredRenderable, Renderable } from '../../dom';
import { Inject, Type } from '../../di';
import { 
  GenericSerializer, 
  SerializerContainer, 
  Serializer, 
  Serialized, 
  GenericSerializerConfig
} from '../../serialization';
import { XYDirection, RenderableConstructorArg, ConfigureableType } from '../../common';
import { StackControlPosition, StackControl } from './StackControl';
import { ConfiguredItem } from '../../ConfiguredItem';

export interface SerializedStackControl extends Serialized {
  position: StackControlPosition;
}

export class StackControlSerializer<R extends StackControl> extends GenericSerializer<R> {
  serialize(node: R): SerializedStackControl {
    return {
      name: this.config.name,
      position: node.position
    };
  }

  deserialize(node: SerializedStackControl): RenderableConstructorArg<R> {
    return this.config.type.configure ? this.config.type.configure(node) : this.config.type;
  }

  static configure<R extends Renderable>(config: GenericSerializerConfig<R>): ConfiguredItem<typeof StackControlSerializer, GenericSerializerConfig<R>> {
    return new ConfiguredItem(StackControlSerializer, config);
  }
}