import { Serializer, Serialized } from './common';
import { SerializerContainer } from './SerializerContainer';
import { Renderable } from '../dom';
import { RenderableConstructorArg, ConfigureableType } from '../common';

/**
 * A serializer that can be used for renderables that don't container
 * any special logic or configuration.
 * @export
 * @class GenericSerializer
 * @implements {Serializer<R, Serialized>}
 * @template R The renderable type.
 */
export class GenericSerializer<R extends Renderable> implements Serializer<R, Serialized> {
  /**
   * Creates an instance of GenericSerializer.
   * @param {string} _name 
   * @param {ConfigureableType<R>} _Class 
   */
  constructor(
    protected _name: string,
    protected _Class: ConfigureableType<R>
  ) {}
  
  /**
   * Serializes the renderable.
   * @param {R} node 
   * @returns {Serialized} 
   */
  serialize(node: R): Serialized {
    return { name: this._name } ;
  }

  /**
   * Deserializes the node.
   * @param {Serialized} node 
   * @returns {RenderableArg<R>} 
   */
  deserialize(node: Serialized): RenderableConstructorArg<R> {
    return this._Class;
  }

  /**
   * Registers this class with the container.
   * @param {SerializerContainer} container 
   */
  register(container: SerializerContainer): void {
    container.registerClass(this._name, this._Class);
  }
}