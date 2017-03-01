import { Injector, forwardRef } from './Injector';
import { Token } from './common';
import { Inject } from './decorators';
import test from 'ava';

class MyClass {}

test('should get the class dependency', t => {
  const injector = new Injector([ MyClass ]);

  t.true(injector.get(MyClass) instanceof MyClass);
});

test('should get the factory dependency', t => {
  const injector = new Injector([{ provide: MyClass, useFactory: () => new MyClass() }]);

  t.true(injector.get(MyClass) instanceof MyClass);
});

test('should get the value dependency', t => {
  const injector = new Injector([{ provide: MyClass, useValue: new MyClass() }]);

  t.true(injector.get(MyClass) instanceof MyClass);
});

test('should get the existing dependency', t => {
  const token = new Token('test');
  const injector = new Injector([ MyClass, { provide: token, useExisting: MyClass }]);
  const myClass = injector.get(MyClass);

  t.true(injector.get(token) === myClass);
});

test('should get the dependency from parent', t => {
  const parent = new Injector([ MyClass ]);
  const injector = new Injector([], parent);
  const myClass = injector.get(MyClass);

  t.true(injector.get(MyClass) instanceof MyClass);
});

test('should get the dependency lazily', t => {
  const injector = new Injector([ MyClass ]);
  const getMyClass = injector.get(MyClass, null, { lazy: true });

  t.is(typeof getMyClass, 'function');
  t.true(getMyClass() instanceof MyClass);
});

test('should return null for optional dependency', t => {
  const injector = new Injector([]);

  t.is(injector.get(MyClass, undefined, { optional: true }), null);
});

test('should only get from self', t => {
  const parent = new Injector([ MyClass ]);
  const injector = new Injector([], parent);
  const myClass = injector.get(MyClass, null, { self: true });

  t.is(myClass, null);
});

test('should return the default value', t => {
  const injector = new Injector([]);

  t.is(injector.get(MyClass, 'test'), 'test');
});

test('should return the same references', t => {
  const injector = new Injector([ MyClass ]);
  const myClass = injector.get(MyClass);
  const otherMyClass = injector.get(MyClass);

  t.true(myClass === otherMyClass);
});

test('should throw if not found', t => {
  const injector = new Injector([]);

  t.throws(() => injector.get(MyClass));
});

test('should resolve a forwardRef', t => {
  const token = new Token('test');
  const injector = new Injector([ MyClass, { provide: token, useValue: forwardRef(() => myClass) } ]);
  const myClass = injector.get(MyClass);

  t.is(injector.get(token), myClass);
});

test('should resolve the provider with the injector', t => {
  t.plan(2);
  
  const injector = new Injector([ MyClass ]);
  class TestClass {
    constructor(
      @Inject(MyClass) myClass: MyClass
    ) {
      t.true(myClass instanceof MyClass);
    }
  }

  const testClass = injector.resolveAndInstantiate(TestClass);

  t.true(testClass instanceof TestClass);
});