import test from 'ava';
import { spy } from 'sinon';

import { ConfiguredRenderable } from './ConfiguredRenderable';
import { RenderableInjector } from './RenderableInjector';
import { Renderable } from './Renderable';
import { ConfigurationRef } from '../common';

test('creating from a configured renderable', t => {
  const initSpy = spy();
  class MyClass extends Renderable {
    render(): any {}
    initialize(): any { initSpy() }
  };

  const config = {};
  const configured = new ConfiguredRenderable(MyClass, config);
  const injector = RenderableInjector.fromRenderable(configured);

  t.true(injector.get(ConfiguredRenderable) instanceof MyClass);
  t.is(injector.get(ConfigurationRef), config);
  t.is(initSpy.callCount, 1);
});

test('creating from a renderable', t => {
  class MyClass extends Renderable {
    render(): any {}
    initialize(): any {}
  };

  const renderable = new MyClass();
  const injector = RenderableInjector.fromRenderable(renderable);

  t.is(injector.get<Renderable>(ConfiguredRenderable as any), renderable);
  t.is(injector.get(ConfigurationRef), null);
});

test('creating from a renderable constructor', t => {
  class MyClass extends Renderable {
    render(): any {}
    initialize(): any {}
  };

  const injector = RenderableInjector.fromRenderable(MyClass);

  t.true(injector.get(ConfiguredRenderable) instanceof MyClass);
  t.is(injector.get(ConfigurationRef), null);
});