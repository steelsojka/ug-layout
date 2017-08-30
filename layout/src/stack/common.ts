import { Token } from '../di';

/**
 * A stack region.
 * @export
 * @enum {number}
 */
export enum StackRegion {
  NORTH,
  SOUTH,
  EAST,
  WEST
}

export const STACK_TAB_CLASS = new Token('STACK_TAB_CLASS');
export const STACK_HEADER_CLASS = new Token('STACK_HEADER_CLASS');
export const STACK_ITEM_CONTAINER_CLASS = new Token('STACK_ITEM_CONTAINER_CLASS');
export const STACK_CLASS = new Token('STACK_CLASS');
