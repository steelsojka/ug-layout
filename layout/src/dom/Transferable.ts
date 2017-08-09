import { Renderable } from './Renderable';
import { isFunction } from '../utils';

/**
 * An interface for transferring from one renderable to another.
 * @export
 * @interface Transferable
 */
export interface Transferable {
  /**
   * Gets config properties that should be transferred to a new Renderable.
   * @param {Renderable} to The renderable asking for the transfer.
   * @returns {{ [key: string]: any }} 
   */
  getTransferableConfig(to: Renderable): { [key: string]: any };
}

/**
 * Determines whether an item is transferable.
 * @export
 * @template T 
 * @param {(T & { [key: string]: any })} item 
 * @returns {(item is T & Transferable)} 
 */
export function isTransferable<T>(item: T & { [key: string]: any }): item is T & Transferable {
  return isFunction(item['getTransferableConfig']);
}