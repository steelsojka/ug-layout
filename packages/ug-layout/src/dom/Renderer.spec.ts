import test from 'ava';
import { stub, spy } from 'sinon';
import { getRenderable } from '../../test/unit/helpers';
import { DocumentRef, PatchRef } from '../common';

import { Renderer } from './Renderer';

const document = {
  createElement: stub()
};

const patch = stub();

function getRenderer(): Renderer {
  return getRenderable(Renderer, [
    { provide: DocumentRef, useValue: document },
    { provide: PatchRef, useValue: patch }
  ]);
}

test('initializing', t => {
  const renderer = getRenderer();
  const el = {
    appendChild: stub()
  };
  const mount = {};
  
  document.createElement.returns(mount);
  renderer.initialize();

  t.is((<any>renderer)._mountPoint, mount);
});

test('setting the node generator', t => {
  const renderer = getRenderer();  
  const gen = () => null;

  renderer.useNodeGenerator(gen as any);
  t.is((<any>renderer)._nodeGenerator, gen);
});

test('rendering', t => {
  const renderer = getRenderer();
  const lastVNode = {};  
  const rendered = spy();
  const tree = {};
  const mount = {};

  Object.assign(renderer, {
    _nodeGenerator: () => tree,
    _mountPoint: mount
  });
  
  patch.returns(lastVNode);
  renderer.rendered.subscribe(rendered);
  renderer.render(); 
  
  t.true(rendered.called);
  t.is((<any>renderer)._lastVNode, lastVNode);
  t.is(patch.firstCall.args[0], mount);
  t.is(patch.firstCall.args[1], tree);

  const newTree = {};
  const newLastVNode = {};
  
  Object.assign(renderer, {
    _nodeGenerator: () => newTree,
  });
  
  patch.returns(newLastVNode);
  renderer.render(); 
  
  t.is((<any>renderer)._lastVNode, newLastVNode);
  t.is(patch.secondCall.args[0], lastVNode);
  t.is(patch.secondCall.args[1], newTree);
});

test('destroying', t => {
  const renderer = getRenderer();
  const detachStub = stub(renderer, 'detach');
  const renderedComplete = spy();

  renderer.rendered.subscribe({ complete: renderedComplete });
  renderer.destroy();

  t.true(renderedComplete.called);
  t.true(detachStub.called);
});

test('detaching when already renderered', t => {
  const renderer = getRenderer();
  const elm = {}
  const container = {
    removeChild: spy()  
  };

  Object.assign(renderer, {
    _lastVNode: { elm },
    _containerEl: container
  });

  renderer.detach();

  t.true(container.removeChild.called);
  t.is(container.removeChild.firstCall.args[0], elm);
});

test('detaching when not renderered', t => {
  const renderer = getRenderer();
  const mount = {};
  const container = {
    removeChild: spy()  
  };

  Object.assign(renderer, {
    _lastVNode: null,
    _mountPoint: mount,
    _containerEl: container
  });

  renderer.detach();

  t.true(container.removeChild.called);
  t.is(container.removeChild.firstCall.args[0], mount);
});