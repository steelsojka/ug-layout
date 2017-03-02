import test from 'ava';
import { spy } from 'sinon';

import { GenericSerializer } from './GenericSerializer';

class MyClass {};

let serializer: GenericSerializer<any>;

test.beforeEach(() => {
  serializer = new GenericSerializer('Test', MyClass as any);
});

test('serialize', t => {
  const results = serializer.serialize({} as any);

  t.is(results.name, 'Test');
});

test('deserialize', t => {
  const results = serializer.deserialize({} as any);

  t.is(results, MyClass);
});

test('registration', t => {
  const _spy = spy();
  serializer.register({ registerClass: _spy } as any);

  t.is(_spy.callCount, 1);
  t.is(_spy.args[0][0], 'Test');
  t.is(_spy.args[0][1], MyClass);
});