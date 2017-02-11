import { Observer } from 'rxjs/Observer';
import { Observable } from 'rxjs/Observable';

import { Type } from '../di';

export interface BusEventOptions {}

export class BusEvent<T> {
  private _promise: Promise<this>;
  private _isPropagationStopped: boolean = false;
  
  constructor(
    protected _target: T, 
    protected _options: BusEventOptions = {},
    protected _parent: BusEvent<any>|null = null
  ) {
    this._promise = Promise.resolve(this);
  }

  get target(): T {
    return this._target;
  }

  get origin(): any {
    if (this._parent) {
      return this._parent.origin;
    }

    return this;
  }

  get isPropagationStopped(): boolean {
    return this._isPropagationStopped;
  }

  get options(): BusEventOptions {
    return this._options;
  }

  get done(): Promise<this> {
    if (this._parent) {
      return this._parent.done;
    }
    
    return this._promise;
  }

  wait(fn: () => any): void {
    if (this._parent) {
      this._parent.wait(fn);

      return;
    }
    
    this._promise = this._promise.then(value => {
      return Promise.resolve(fn()).then(() => value);
    });
  }

  delegate<U extends BusEvent<any>>(Ctor: Type<U>, target: any = this.target, options: BusEventOptions = {}): U {
    return new Ctor(target, { ...this.options, ...options }, this);
  }

  stopPropagation(): void {
    this._isPropagationStopped = true;
  }

  dispatch(subscriber: Observer<this>): void {
    subscriber.next(this);
  }
}