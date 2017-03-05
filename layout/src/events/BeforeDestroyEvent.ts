import { Cancellable } from './Cancellable';

/**
 * Event fired before an item is destroyed. Mostly used in a {@link View}.
 * This event allows the user to cancel the destruction of a Renderable. For example,
 * if a tab is closed this event will be fired and sent down the tree and subscribed
 * to by a view. The view can perform an async clean up task or display a confirm to the user
 * before actually destroying the Renderable.
 * @export
 * @see {@link Cancellable}
 * @class BeforeDestroyEvent
 * @extends {Cancellable<T>}
 * @template T The target type.
 * @example
 * class MyView {
 *   ugOnBeforeDestroy(e: BeforeDestroyEvent): void {
 *     e.wait(async () => {
 *       const confirmed = await this.confirmClose();
 * 
 *       if (!confirmed) {
 *         e.cancel(); 
 *       }
 *     });
 *   }
 * }
 */
export class BeforeDestroyEvent<T> extends Cancellable<T> {}