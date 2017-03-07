import { Renderable, RenderableArea } from './dom';
import { DropArea, DragStatus, HighlightCoordinateArgs } from './common';

/**
 * @typedef {Object} DragOptions
 * @property {T} host The host object for the event.
 * @property {number} startX The start pageX coordinates.
 * @property {number} startY The start pageX coordinates.
 * @property {number} [threshold] The threshold before the dragging should start.
 */

/**
 * @typedef {Object} DropArea
 * @property {RenderableDropTarget} item The renderable being dropped.
 * @property {RenderableArea} area The area being dropped.
 * @property {RenderableArea} dragArea The area of the item being dragged.
 */

/**
 * @typedef {Object} HighlightCoordinateArgs Argument object given when a renderable
 * is determining the area to highlight.
 * @property {number} pageX The current page x.
 * @property {number} pageY The current page y.
 * @property {DropArea} dropArea The current drop area.
 * @property {RenderableArea} dragArea The current dragging items area.
 */

/**
 * An interface that signifies the renderable can handle drops.
 * @interface
 */
export class DropTarget {
  /**
   * Handles an item being dropped on this Renderable.
   * @param {Renderable} item 
   * @param {DropArea} dropArea 
   * @param {DragEvent<Renderable>} event 
   */
  handleDrop(item: Renderable, dropArea: DropArea, event: DragEvent<Renderable>): void {}
  /**
   * Calculates the highlight coordinates for the drop target.
   * @param {HighlightCoordinateArgs} args 
   * @returns {RenderableArea} 
   */
  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea { return {} as any; }
  /**
   * Invoked when the item is no longer a drop target.
   */
  onDropHighlightExit(): void {}
}

/**
 * An event interface that is emitted from a {@link Draggable}.
 * @interface
 * @template T The host object.
 */
export class DragEvent<T> {
  /**
   * The object being dragged.
   * @type {T}
   */
  host: T = {} as T;
  /**
   * The current delta x coordinates.
   * @type {number}
   */
  x: number = 0;
  /**
   * The current delta y coordinates.
   * @type {number}
   */
  y: number = 0;
  /**
   * The current page x offset.
   * @type {number}
   */
  pageX: number = 0;
  /**
   * The current page y offset.
   * @type {number}
   */
  pageY: number = 0;  
  /**
   * The drag status.
   * @type {DragStatus}
   */
  status: DragStatus = DragStatus.START;
}

/**
 * @external {Observable} http://reactivex.io/rxjs/class/es6/Observable.js~Observable.html
 */
/**
 * @external {Subject} http://reactivex.io/rxjs/class/es6/Subject.js~Subject.html
 */
/**
 * @external {BehaviorSubject} http://reactivex.io/rxjs/class/es6/BehaviorSubject.js~BehaviorSubject.html
 */
/**
 * @external {Subscription} http://reactivex.io/rxjs/class/es6/Subscription.js~Subscription.html 
 */
/**
 * @external {Document} https://developer.mozilla.org/en-US/docs/Web/API/Document
 */
/**
 * @external {HTMLElement} https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement 
 */