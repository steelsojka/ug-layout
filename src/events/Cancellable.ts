import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { AsyncEvent } from './AsyncEvent';
import { CancelAction } from './CancelAction';

export class Cancellable<T> extends AsyncEvent<T> {
  cancel(): void {
    throw new CancelAction();  
  }
  
  static dispatch<T>(subject: Subject<Cancellable<T>>, value: T): Observable<T> {
    return Observable.create(async subscriber => {
      const event = new Cancellable(value);

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