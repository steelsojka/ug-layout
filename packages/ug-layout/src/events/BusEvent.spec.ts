import test from 'ava';
import { spy } from 'sinon';
import { Subject } from 'rxjs/Subject';

import { BusEvent } from './BusEvent';

class MyEvent extends BusEvent<any> {}
class OtherEvent extends BusEvent<any> {}

test('getting the origin event', t => {
  const event = new MyEvent(null);
  const childEvent = new MyEvent(null, {}, event);

  t.is(childEvent.origin, event);
});

test('waiting for an event', async t => {
  const _spy = spy();
  const event = new MyEvent(null);
  const childEvent = new MyEvent(null, {}, event);

  childEvent.wait(() => {
    return new Promise(resolve => setTimeout(resolve, 1));
  });

  childEvent.done.then(() => _spy('child'));
  event.done.then(() => _spy('parent'));

  await childEvent.done;

  t.is(_spy.callCount, 2);
  t.is(_spy.firstCall.args[0], 'child');
  t.is(_spy.secondCall.args[0], 'parent');
});

test('delegating to another event', t => {
  const target = {};
  const event = new MyEvent(target);
  const childEvent = event.delegate(OtherEvent);

  t.true(childEvent instanceof OtherEvent);
  t.is(childEvent.origin, event);
});

test('stopping propagation', t => {
  const event = new MyEvent(null);

  event.stopPropagation();

  t.true(event.isPropagationStopped);
});

test('dispatching', t => {
  const event = new MyEvent(null);
  const subject = new Subject();
  const _spy = spy();

  subject.subscribe(_spy);
  event.dispatch(subject);

  t.true(_spy.called);
  t.is(_spy.firstCall.args[0], event);
});