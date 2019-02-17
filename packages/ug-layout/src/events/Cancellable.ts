import { Observable, Subscriber } from 'rxjs';

import { BusEvent } from './BusEvent';
import { CancelAction } from './CancelAction';

/**
 * An event that can be cancelled.
 * @export
 * @class Cancellable
 * @extends {BusEvent<T>}
 * @template T The target type.
 */
export class Cancellable<T> extends BusEvent<T> {
  /**
   * Cancels the event. Only valid within the context of the `wait` method.
   * @see {@link BusEvent#wait}
   */
  cancel(): void {
    throw new CancelAction();
  }

  /**
   * Creates an observable that waits for the results of the event.
   * @returns {Observable<this>}
   * @example
   * const event = new Cancellable(null);
   *
   * bus.emit(event);
   *
   * event.results().subscribe(() => {
   *   // The event was successful and NOT cancelled.
   * });
   */
  results(): Observable<this> {
    return Observable.create(async (subscriber: Subscriber<this>) => {
      let error: Error | null = null;

      try {
        await this.done;
      } catch (e) {
        error = e;
      }

      if (error) {
        if (!(error instanceof CancelAction)) {
          subscriber.error(error);
        } else {
          subscriber.complete();
        }
      } else {
        subscriber.next(this);
        subscriber.complete();
      }
    });
  }
}