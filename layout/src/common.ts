import { VNode } from 'snabbdom/vnode';

import { Token, Type } from './di';
import { Renderable, ConfiguredRenderable, RenderableArea } from './dom';

export enum XYDirection {
  X,
  Y
}

export const ContextType: { [key: string]: string } = {
  NONE: 'NONE',
  LOAD: 'LOAD'
};

/**
 * Symbol that signifies that an XYItemContainer's ratio is unallocated.
 * @type {Symbol}
 */
export const UNALLOCATED = Symbol('UNALLOCATED');

export type RenderableConstructorArg<T extends Renderable> = Type<T>|ConfiguredRenderable<T>;
export type RenderableArg<T extends Renderable> = Type<T>|ConfiguredRenderable<T>|T;
export type Patch = (oldVNode: VNode|Node, newVNode: VNode) => VNode;

export interface ConfigureableType<T extends Renderable> extends Type<T> {
  configure?: (config: object) => ConfiguredRenderable<T>;
}

export interface DropArea { 
  item: RenderableDropTarget;
  area: RenderableArea;
  dragArea: RenderableArea;
};

export enum DragStatus {
  START,
  STOP,
  DRAGGING  
}

export interface DragOptions<T> {
  host: T;
  startX: number;
  startY: number;
  threshold?: number;
}

/**
 * An event interface that is emitted from a {@link Draggable}.
 * @export
 * @interface DragEvent
 * @template T The host object.
 */
export interface DragEvent<T> {
  /**
   * The object being dragged.
   * @type {T}
   */
  host: T;
  /**
   * The current delta x coordinates.
   * @type {number}
   */
  x: number;
  /**
   * The current delta y coordinates.
   * @type {number}
   */
  y: number;
  /**
   * The current page x offset.
   * @type {number}
   */
  pageX: number;
  /**
   * The current page y offset.
   * @type {number}
   */
  pageY: number;  
  /**
   * The drag status.
   * @type {DragStatus}
   */
  status: DragStatus;
}

export interface HighlightCoordinateArgs {
  pageX: number;
  pageY: number;
  dropArea: DropArea;
  dragArea: RenderableArea;
}

/**
 * An interface that signifies the renderable can handle drops.
 * @export
 * @interface DropTarget
 */
export interface DropTarget {
  /**
   * Handles an item being dropped on this Renderable.
   * @param {Renderable} item 
   * @param {DropArea} dropArea 
   * @param {DragEvent<Renderable>} event 
   */
  handleDrop(item: Renderable, dropArea: DropArea, event: DragEvent<Renderable>): void;
  /**
   * Calculates the highlight coordinates for the drop target.
   * @param {HighlightCoordinateArgs} args 
   * @returns {RenderableArea} 
   */
  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea;
  /**
   * Invoked when the item is no longer a drop target.
   */
  onDropHighlightExit(): void;
}

export interface RenderableDropTarget extends Renderable, DropTarget {} 

/**
 * Injection token for the Document API.
 * @type {Token}
 */
export const DocumentRef = new Token<Document>('DocumentRef');
/**
 * Injection token for the root configuration used to create a {@link RootLayout}
 * @type {Token}
 */
export const RootConfigRef = new Token<any>('RootConfigRef');
/**
 * Injection token for injecting the container renderable.
 * @type {Token}
 */
export const ContainerRef = new Token<Renderable>('ContainerRef');
/**
 * Injection token for injecting the renderables configuration.
 * @see {@link ConfiguredRenderable}
 * @type {Token}
 */
export const ConfigurationRef = new Token<any>('ConfigurationRef');
/**
 * Injection token for injecting an HTML element associated with the renderable.
 * @type {Token}
 */
export const ElementRef = new Token<HTMLElement>('ElementRef');
/**
 * Injection token for injecting the patch method generated by snabbdom.
 * This allows for custom modules to be added to snabbdom that are not enabled
 * by default.
 * @type {Token}
 */
export const PatchRef = new Token<Function>('PatchRef');