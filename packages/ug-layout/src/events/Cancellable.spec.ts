import test from 'ava';
import { spy } from 'sinon';
import 'rxjs/Rx';

import { Cancellable } from './Cancellable';

test('waiting for complete results', async t => {
  const event = new Cancellable(null);
  const _spy = spy();
  const _complete = spy();

  const done = event.results()
  
  done.subscribe({ next: _spy, complete: _complete });

  await done.toPromise();

  t.is(_spy.callCount, 1);
  t.is(_spy.firstCall.args[0], event);
  t.is(_complete.callCount, 1);
});

test('cancelling results', async t => {
  const event = new Cancellable(null);
  const _spy = spy();
  const _complete = spy();
  const _error = spy();

  event.wait(() => {
    event.cancel();
  });

  const done = event.results();

  done.subscribe({ next: _spy, error: _error, complete: _complete });

  await done.toPromise();

  t.is(_spy.callCount, 0);
  t.is(_error.callCount, 0);
  t.is(_complete.callCount, 1);
});

test('when erroring', async t => {
  const event = new Cancellable(null);
  const _spy = spy();
  const _complete = spy();
  const _error = spy();

  event.wait(() => {
    throw new Error();
  });

  const done = event.results();

  done.subscribe({ next: _spy, error: _error, complete: _complete });

  t.throws(done.toPromise());

  t.is(_spy.callCount, 0);
  t.is(_error.callCount, 0);
  t.is(_complete.callCount, 0);
});