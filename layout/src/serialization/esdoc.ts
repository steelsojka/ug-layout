import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { Serialized } from './common';

/**
 * @typedef {Object} Serialized
 * @property {string} name The name to identify the serialized node.
 */

/**
 * @typedef {Object} SerializerContainerConfig
 * @property {Injector} [injector] An injector to use as the parent injector.
 */

/**
 * @interface Serializer
 * @template R The renderable type.
 * @template S The serialized type.
 */
export class Serializer<R extends Renderable, S extends Serialized> {
  /**
   * Serializes a renderable into a storeable format.
   * @param {R} node 
   * @returns {S} 
   */
  serialize(node: R): S {
    return {} as any;
  }
  
  /**
   * Desserializes a serialized renderable into a Renderable.
   * @param {S} serialized 
   * @returns {RenderableArg<R>} 
   */
  deserialize(serialized: S): RenderableArg<R> {
    return {} as any;
  }
}
