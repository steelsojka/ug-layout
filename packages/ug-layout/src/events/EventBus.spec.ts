import test from 'ava';
import { spy } from 'sinon';

import { EventBus } from './EventBus';
import { BusEvent } from './BusEvent';

let eventBus: EventBus;

class MyEvent extends BusEvent<any> {}
class OtherEvent extends BusEvent<any> {}

test.beforeEach(() => {
  eventBus = new EventBus();
});

test('subscribing', t => {
  const _spy = spy();    
  const event = new MyEvent(null);

  eventBus.subscribe(MyEvent, _spy);
  eventBus.next(event);

  t.true(_spy.called);
  t.is(_spy.firstCall.args[0], event);
});

test('scoping', t => {
  const _spy = spy();    

  eventBus.scope(MyEvent).subscribe(_spy);
  eventBus.next(new MyEvent(null));
  eventBus.next(new OtherEvent(null));

  t.is(_spy.callCount, 1);
});
