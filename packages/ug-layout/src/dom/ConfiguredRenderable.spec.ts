import { ConfiguredRenderable } from './ConfiguredRenderable';
import { Renderable } from './Renderable';
import test from 'ava';

class MyClass extends Renderable {
  render(): any {}
}

const config = {};

const configured = new ConfiguredRenderable(MyClass, config);

test('should store the renderable and config', t => {
  t.is(configured.config, config);
  t.is(configured.renderable, MyClass);
});

test('should resolve the renderable', t => {
  t.is(ConfiguredRenderable.resolve(configured), MyClass);
  t.is(ConfiguredRenderable.resolve(new MyClass()), MyClass);
  t.is(ConfiguredRenderable.resolve(MyClass), MyClass);
});

test('should resolve the configuration', t => {
  t.is(ConfiguredRenderable.resolveConfiguration(configured), config);
  t.is(ConfiguredRenderable.resolveConfiguration(config), config);
});

test('should determine if the renderable is in list', t => {
  t.true(ConfiguredRenderable.inList([ new MyClass() ], configured));
  t.true(ConfiguredRenderable.inList([ configured ], new MyClass()));
  t.true(ConfiguredRenderable.inList([ configured ], MyClass));

  t.false(ConfiguredRenderable.inList([ {} as any ], MyClass));
});