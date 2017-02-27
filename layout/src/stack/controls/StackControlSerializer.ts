import { ConfiguredRenderable } from '../../dom';
import { Inject, Type } from '../../di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from '../../serialization';
import { XYDirection, RenderableArg, ConfigureableType } from '../../common';
import { StackControlPosition, StackControl } from './StackControl';

export interface SerializedStackControl extends Serialized {
  position: StackControlPosition;
}

export class StackControlSerializer<R extends StackControl> extends GenericSerializer<R> implements Serializer<R, SerializedStackControl> {
  serialize(node: R): SerializedStackControl {
    return {
      name: this._name,
      position: node.position
    };
  }

  deserialize(node: SerializedStackControl): RenderableArg<R> {
    return this._Class.configure ? this._Class.configure(node) : this._Class;
  }
}