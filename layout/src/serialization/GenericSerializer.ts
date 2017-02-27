import { Serializer, Serialized } from './common';
import { SerializerContainer } from './SerializerContainer';
import { Renderable } from '../dom';
import { RenderableArg, ConfigureableType } from '../common';

export class GenericSerializer<R extends Renderable> implements Serializer<R, Serialized> {
  constructor(
    protected _name: string,
    protected _Class: ConfigureableType<R>
  ) {}
  
  serialize(node: R): Serialized {
    return { name: this._name } ;
  }

  deserialize(node: Serialized): RenderableArg<R> {
    return this._Class;
  }

  register(container: SerializerContainer): void {
    container.registerClass(this._name, this._Class);
  }
}