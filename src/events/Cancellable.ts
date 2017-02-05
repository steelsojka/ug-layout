import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AsyncEvent } from './AsyncEvent';
import { CancelAction } from './CancelAction';

export abstract class Cancellable {
  static dispatch<T>(subject: Subject<AsyncEvent<T>>, value: T): Observable<T> {
    return Observable.create(async subscriber => {
      const event = new AsyncEvent(value);

      subject.next(event);

      try {
        await event.done;
        subscriber.next(value);
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