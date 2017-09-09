import test from 'ava';
import { spy } from 'sinon';

import { SerializerContainer } from './SerializerContainer';

function getContainer(): SerializerContainer {
  return new SerializerContainer();
}

class MyClass {}

test('register itself with the injector', t => {
  const container = getContainer();

  t.is(container.resolve(SerializerContainer), container);
});

test('registering a class serializer', t => {
  const container = getContainer();
  const _spy = spy();

  class Serializer {
    static register(a) { _spy(a); }
  };
  
  container.registerSerializer(MyClass, Serializer as any);

  t.is(_spy.callCount, 1);
  t.is(_spy.args[0][0], container);
  t.true(container.resolveFromClass(MyClass) instanceof Serializer);
});

test('registering an instance serializer', t => {
  const container = getContainer();
  const _spy = spy();

  class Serializer {
    register(a) { _spy(a); }
  };

  const serializer = new Serializer();
  
  container.registerSerializer(MyClass, serializer as any);

  t.is(_spy.callCount, 1);
  t.is(_spy.args[0][0], container);
  t.is<any>(container.resolveFromClass(MyClass), serializer);
});

test('when skipping registration', t => {
  const container = getContainer();
  const _spy = spy();

  class Serializer {
    register(a) { _spy(a); }
  };

  const serializer = new Serializer();
  
  container.registerSerializer(MyClass, serializer as any, { skipRegister: true });

  t.false(_spy.called);
});

test('registering a class', t => {
  const container = getContainer();

  container.registerClass('test', MyClass);

  t.is(container.resolveClass('test'), MyClass);
});

test('registering multiple classes', t => {
  const container = getContainer();
  
  class OtherClass extends MyClass {}

  container.registerClasses({
    test: MyClass,
    other: OtherClass
  });

  t.is(container.resolveClass('test'), MyClass);
  t.is(container.resolveClass('other'), OtherClass);
});

test('resolving a class string', t => {
  const container = getContainer();
  
  container.registerClass('test', MyClass);

  t.is(container.resolveClassString(MyClass), 'test');
});

test('resolving a serializer from a serialized node', t => {
  const container = getContainer();

  class Serializer {}
  
  container.registerClass('test', MyClass);
  container.registerSerializer(MyClass, Serializer as any);

  t.true(container.resolveFromSerialized({ name: 'test' }) instanceof Serializer);
});

test('resolving a serializer from a node', t => {
  const container = getContainer();

  class Serializer {}
  class OtherClass {}
  
  container.registerSerializer(MyClass, Serializer as any);

  t.true(container.resolveFromClass(MyClass) instanceof Serializer);
  t.is(container.resolveFromClass(OtherClass), null);
});

test('resolving a serializer from an instance', t => {
  const container = getContainer();

  class Serializer {}
  
  container.registerSerializer(MyClass, Serializer as any);

  t.true(container.resolveFromInstance(new MyClass() as any) instanceof Serializer);
});

test('resolving a class from a string', t => {
  const container = getContainer();

  container.registerClass('test', MyClass);

  t.is(container.resolveClass('test'), MyClass);
  t.is(container.resolveClass('blorg'), null);
});

test('serializing a node', t => {
  const container = getContainer();
  const serialized = { name: 'test' };

  class Serializer {
    serialize(): any {
      return serialized;
    }
  }

  container.registerSerializer(MyClass, Serializer as any);

  t.is(container.serialize(new MyClass() as any), serialized);
});

test('deserializing a node', t => {
  const container = getContainer();
  const serialized = { name: 'test' };

  class Serializer {
    deserialize(): any {
      return MyClass;
    }
  }

  container.registerClass('test', MyClass);
  container.registerSerializer(MyClass, Serializer as any);

  t.is<any>(container.deserialize(serialized), MyClass);
});