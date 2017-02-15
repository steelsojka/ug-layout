import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { Subscription } from 'rxjs/Subscription';
import { Observer, PartialObserver } from 'rxjs/Observer';

import { Type } from '../di';
import { isFunction } from '../utils';
import { BusEvent } from './BusEvent';

export class EventBus {
  private _bus: Subject<any> = new Subject();
  private _observable: Observable<any>;

  constructor() {
    this._observable = this._bus.asObservable();
  }

  subscribe<T extends BusEvent<any>>(Event: Type<T>, observer: PartialObserver<T>|((event: T) => void)): Subscription {
    return this.scope(Event).subscribe(observer as PartialObserver<T>);
  }

  scope<T extends BusEvent<any>>(Event: Type<T>): Observable<T> {
    return this._observable.filter(e => e instanceof Event);
  }

  next<T extends BusEvent<any>>(event: T): void {
    event.dispatch(this._bus);
  }
}