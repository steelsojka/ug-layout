import test from 'ava';

import { Injector } from '../di';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { RenderableInjector } from './RenderableInjector';
import { Renderable } from './Renderable';
import { Renderer } from './Renderer';
import { ConfigurationRef } from '../common';

test('creating from a configured renderable', t => {
  class MyClass {};
  
  const config = {};
  const configured = new ConfiguredRenderable(MyClass as any, config);
  const injector = RenderableInjector.fromRenderable(configured);

  t.true(injector.get(ConfiguredRenderable) instanceof MyClass);
  t.is(injector.get(ConfigurationRef), config);
});

test('creating from a renderable', t => {
  class MyClass extends Renderable {
    render(): any {}
  };

  const renderable = new MyClass(new Injector([ { provide: Renderer, useValue: {} } ]));
  const injector = RenderableInjector.fromRenderable(renderable);

  t.is(injector.get(ConfiguredRenderable), renderable);
  t.is(injector.get(ConfigurationRef), null);
});

test('creating from a renderable constructor', t => {
  class MyClass extends Renderable {
    constructor() {
      super(new Injector([ { provide: Renderer, useValue: {} } ]));
    }
    
    render(): any {}
  };

  const injector = RenderableInjector.fromRenderable(MyClass);

  t.true(injector.get(ConfiguredRenderable) instanceof MyClass);
  t.is(injector.get(ConfigurationRef), null);
});