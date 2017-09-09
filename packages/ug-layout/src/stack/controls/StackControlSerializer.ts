import { ConfiguredRenderable, Renderable } from '../../dom';
import { Inject, Type } from '../../di';
import { 
  GenericSerializer, 
  SerializerContainer, 
  Serializer, 
  Serialized, 
  GenericSerializerConfig,
  ConfiguredSerializer
} from '../../serialization';
import { XYDirection, RenderableConstructorArg, ConfigureableType } from '../../common';
import { StackControlPosition, StackControl } from './StackControl';

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
}