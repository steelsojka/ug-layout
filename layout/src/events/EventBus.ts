import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Observer, PartialObserver } from 'rxjs/Observer';
import 'rxjs/add/operator/filter';

import { Type } from '../di';
import { isFunction } from '../utils';
import { BusEvent } from './BusEvent';

/**
 * Custom eventing bus that abstracts common patterns between events.
 * @export
 * @class EventBus
 */
export class EventBus {
  private _bus: Subject<any> = new Subject();
  private _observable: Observable<any>;

  /**
   * Creates an instance of EventBus.
   */
  constructor() {
    this._observable = this._bus.asObservable();
  }

  /**
   * Subscribes to a specific event type.
   * @template T The bus event type.
   * @param {Type<T>} Event 
   * @param {(PartialObserver<T>|((event: T) => void))} observer 
   * @returns {Subscription} 
   */
  subscribe<T extends BusEvent<any>>(Event: Type<T>, observer: PartialObserver<T>|((event: T) => void)): Subscription {
    return this.scope(Event).subscribe(observer as PartialObserver<T>);
  }

  /**
   * Creates an observable scoped to a specific event type.
   * @template T The bus event type.
   * @param {Type<T>} Event 
   * @returns {Observable<T>} 
   */
  scope<T extends BusEvent<any>>(Event: Type<T>): Observable<T> {
    return this._observable.filter(e => e instanceof Event);
  }

  /**
   * Dispatches an event.
   * @template T The bus event type.
   * @param {T} event 
   */
  next<T extends BusEvent<any>>(event: T): void {
    event.dispatch(this._bus);
  }
}