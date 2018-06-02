import test from 'ava';
import { spy } from 'sinon';

import { GenericSerializer } from './GenericSerializer';

class MyClass {};

let serializer: GenericSerializer<any>;

test.beforeEach(() => {
  serializer = new GenericSerializer();
  (serializer as any).config = {
    name: 'Test',
    type: MyClass
  }
});

test('serialize', t => {
  const results = serializer.serialize({} as any);

  t.is(results.name, 'Test');
});

test('deserialize', t => {
  const results = serializer.deserialize({} as any);

  t.is(results, MyClass);
});