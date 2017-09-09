import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

import { Type } from '../di';

export interface BusEventOptions {}

/**
 * An event that can be dispatched from the event bus.
 * @export
 * @class BusEvent
 * @template T The target type.
 */
export class BusEvent<T> {
  private _promise: Promise<this>;
  private _isPropagationStopped: boolean = false;
  
  /**
   * Creates an instance of BusEvent.
   * @param {T} _target 
   * @param {BusEventOptions} [_options={}] 
   * @param {(BusEvent<any>|null)} [_parent=null] 
   */
  constructor(
    protected _target: T, 
    protected _options: BusEventOptions = {},
    protected _parent: BusEvent<any>|null = null
  ) {
    this._promise = Promise.resolve(this);
  }

  /**
   * The target of the event.
   * @readonly
   * @type {T}
   */
  get target(): T {
    return this._target;
  }

  /**
   * The origin event.
   * @readonly
   * @type {*}
   */
  get origin(): any {
    if (this._parent) {
      return this._parent.origin;
    }

    return this;
  }

  /**
   * Whether the propagation of this event is stopped.
   * @readonly
   * @type {boolean}
   */
  get isPropagationStopped(): boolean {
    return this._isPropagationStopped;
  }

  /**
   * The options provided to this event.
   * @readonly
   * @type {BusEventOptions}
   */
  get options(): BusEventOptions {
    return this._options;
  }

  /**
   * A Promise that resolves when the event is 'done'.
   * @readonly
   * @type {Promise<this>}
   */
  get done(): Promise<this> {
    if (this._parent) {
      return this._parent.done;
    }
    
    return this._promise;
  }

  /**
   * Adds a function that will execute and hold up the finishing of this event
   * until the given promise resolves. These are executed in the order the are received.
   * @param {function(): *} fn 
   * @returns {void} 
   */
  wait(fn: () => any): void {
    if (this._parent) {
      this._parent.wait(fn);

      return;
    }
    
    this._promise = this._promise.then(value => {
      return Promise.resolve(fn()).then(() => value);
    });
  }

  /**
   * Creates a new event with a new target and setting this event as the _parent
   * of the new event. This will merge options with the previou event.
   * @template U 
   * @param {Type<U>} Ctor 
   * @param {*} [target=this.target] 
   * @param {BusEventOptions} [options={}] 
   * @returns {U} 
   */
  delegate<U extends BusEvent<any>>(Ctor: Type<U>, target: any = this.target, options: BusEventOptions = {}): U {
    return new Ctor(target, { ...this.options, ...options }, this);
  }

  /**
   * Stops the propagation of the event.
   */
  stopPropagation(): void {
    this._isPropagationStopped = true;
  }

  /**
   * Implements how this event is dispatched on the given event bus.
   * @param {Observer<this>} subscriber 
   */
  dispatch(subscriber: Observer<this>): void {
    subscriber.next(this);
  }
}