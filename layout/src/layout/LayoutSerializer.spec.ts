import test from 'ava';
import { spy } from 'sinon';

import { Layout } from './Layout';
import { LayoutSerializer } from './LayoutSerializer';
import { ConfiguredRenderable } from '../dom';

let container;
let serializer: LayoutSerializer;

test.beforeEach(() => {
  container = {};
  serializer = new LayoutSerializer(container as any);
});


test('serialize', t => {
  const child = {};
  const node = {
    getChildren: () => [ child ]
  };
  const serializedChild = {};
  const serializeSpy = container.serialize = spy(() => serializedChild);
  
  const results = serializer.serialize(node as any);

  t.is(results.child, serializedChild);
  t.is(results.name, 'Layout');
  t.is(serializeSpy.firstCall.args[0], child);
});

test('deserialize', t => {
  const node = {
    child: {}
  };

  const child = {};
  const deserializeSpy = container.deserialize = spy(() => child);
  const results = serializer.deserialize(node as any);

  t.true(results instanceof ConfiguredRenderable);
  t.is(deserializeSpy.firstCall.args[0], node.child);
  t.is(results.config.child, child);
});

test('registration', t => {
  const _spy = spy();
  
  LayoutSerializer.register({ registerClass: _spy } as any);

  t.is(_spy.callCount, 1);
  t.is(_spy.args[0][0], 'Layout');
  t.is(_spy.args[0][1], Layout);
});