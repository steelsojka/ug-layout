import { Observable } from 'rxjs/Observable';
import { Subscriber } from 'rxjs/Subscriber';

import { BusEvent } from './BusEvent';
import { CancelAction } from './CancelAction';

export class Cancellable<T> extends BusEvent<T> {
  cancel(): void {
    throw new CancelAction();  
  }

  results(): Observable<this> {
    return Observable.create(async (subscriber: Subscriber<this>) => {
      try {
        await this.done;
        subscriber.next(this);
      } catch (e) {
        if (!(e instanceof CancelAction)) {
          subscriber.error(e);
        }
      } finally {
        subscriber.complete();
      }
    });
  }
}