import test from 'ava';
import { spy, stub } from 'sinon';

import { Injector } from '../di';
import { Renderable } from './Renderable';
import { RenderableArea } from './RenderableArea';
import { RenderableInjector } from './RenderableInjector';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { BusEvent } from '../events';
import { getRenderable, getRenderableClass } from '../../test/unit/helpers';

class MyEvent extends BusEvent<any> {}

const MyClass = getRenderableClass();

test('should get the container', t => {
  const myClass = getRenderable(MyClass);
  const container = {};
  
  t.is(myClass.container, null);

  (<any>myClass)._container = container;

  t.is<any>(myClass.container, container);
});

test('should get the width', t => {
  const myClass = getRenderable(MyClass);

  (<any>myClass)._width = 10
  
  t.is(myClass.width, 10);
});

test('should get the height', t => {
  const myClass = getRenderable(MyClass);

  (<any>myClass)._height = 10
  
  t.is(myClass.height, 10);
});

test('should get the offsetX', t => {
  const myClass = getRenderable(MyClass);

  (<any>myClass)._container = { offsetX: 15 };
  
  t.is(myClass.offsetX, 15);
  
  (<any>myClass)._container = { offsetX: undefined };
  
  t.is(myClass.offsetX, 0);
});

test('should get the offsetY', t => {
  const myClass = getRenderable(MyClass);

  (<any>myClass)._container = { offsetY: 15 };
  
  t.is(myClass.offsetY, 15);
  
  (<any>myClass)._container = { offsetY: undefined };
  
  t.is(myClass.offsetY, 0);
});

test('should resize all children', t => {
  t.plan(2);
  const myClass = getRenderable(MyClass);  

  myClass.getChildren = () => [{
    resize: () => t.pass()
  }, {
    resize: () => t.pass()
  }] as any;

  myClass.resize();
});

test('should get all children', t => {
  const myClass = getRenderable(MyClass);  
  const item = {};

  (<any>myClass)._contentItems = [ item ];

  t.is(myClass.getChildren()[0], item);
  t.not(myClass.getChildren(), (<any>myClass)._contentItems);
  t.is(myClass.getChildren().length, 1);
});

test('should query the visibility from the parent', t => {
  let isVisible = true;
  const myClass = getRenderable(MyClass);  
  const parent = { isVisible: () => isVisible };

  (<any>myClass)._container = parent;

  t.true(myClass.isVisible());
  
  isVisible = false;
  t.false(myClass.isVisible());
  
  (<any>myClass)._container = null;
  t.false(myClass.isVisible());
});

test('should destroy all content items', t => {
  t.plan(1);
  const myClass = getRenderable(MyClass);  

  (<any>myClass)._contentItems = [ { destroy: () => t.pass() } ];

  myClass.destroy();
});

test('should set the isDestroyed flag to true', t => {
  const myClass = getRenderable(MyClass);  

  myClass.destroy();

  t.true(myClass.isDestroyed);
});

test('should set notify the destroy', t => {
  t.plan(1);
  const myClass = getRenderable(MyClass);  

  myClass.destroyed.subscribe(() => t.pass());
  myClass.destroy();
});

test('should get the immediate parent', t => {
  const myClass = getRenderable(MyClass);  
  const parent = {};

  (<any>myClass)._container = parent;
  
  t.is<any>(myClass.getParent(), parent);
});

test('should get null if no parent', t => {
  const myClass = getRenderable(MyClass);  
  
  t.is<any>(myClass.getParent(), null);
});

test('should the first parent that matches the selector', t => {
  class Parent {}
  
  const myClass = getRenderable(MyClass);  
  const parent = new Parent();
  (<any>myClass)._container = parent;
  
  t.is<any>(myClass.getParent(Parent as any), parent);
});

test('should get the parents', t => {
  const Parent = getRenderableClass();
  const GrandParent = getRenderableClass();
  
  const myClass = getRenderable(MyClass);  
  const parent = getRenderable(Parent);
  const grandParent = getRenderable(GrandParent);
  
  (<any>parent)._container = grandParent;
  (<any>myClass)._container = parent;

  let results = myClass.getParents();
  
  t.is<any>(results.length, 2);
  t.is<any>(results[0], parent);
  t.is<any>(results[1], grandParent);
  
  results = myClass.getParents(Parent);
  
  t.is<any>(results.length, 1);
  t.is<any>(results[0], parent);
  
  results = myClass.getParents(GrandParent);
  
  t.is<any>(results.length, 1);
  t.is<any>(results[0], grandParent);
});

test('should set the container', t => {
  t.plan(3);
  const myClass = getRenderable(MyClass);    
  const Parent = getRenderableClass();
  const parent = getRenderable(Parent);

  myClass.containerChange.subscribe(() => t.pass());
  myClass.setContainer(parent);

  t.is(myClass.injector.parent, parent.injector);
  t.is<any>(myClass.container, parent);
});

test('should subscribe to the event bus', t => {
  t.plan(2);
  const myClass = getRenderable(MyClass);    
  const event = {};
  const observer = {};

  (<any>myClass)._eventBus = {
    subscribe: (e, o) => {
      t.is(e, event);
      t.is(o, observer);
    }
  };

  myClass.subscribe(event as any, observer as any);
});

test('should emit an event', t => {
  t.plan(1);
  const myClass = getRenderable(MyClass);    

  myClass.subscribe(MyEvent, () => t.pass());
  myClass.emit(new MyEvent(null));
});

test('should emit on the child', t => {
  t.plan(1);
  const Child = getRenderableClass();
  const myClass = getRenderable(MyClass);    
  const child = getRenderable(Child);
  
  (<any>myClass)._contentItems = [ child ];
  
  child.subscribe(MyEvent, () => t.pass());
  myClass.emitDown(new MyEvent(null));
});

test('should not emit on the child when propagation is stopped', t => {
  const Child = getRenderableClass();
  const myClass = new MyClass();    
  const child = new Child();
  
  (<any>myClass)._contentItems = [ child ];

  const event =  new MyEvent(null);
  event.stopPropagation();
  
  child.subscribe(MyEvent, () => t.fail());
  myClass.emitDown(event);
});

test('should emit on the parent', t => {
  t.plan(1);
  const Child = getRenderableClass();
  const myClass = getRenderable(MyClass);    
  const child = getRenderable(Child);
  
  (<any>myClass)._contentItems = [ child ];
  (<any>child)._container = myClass;

  myClass.subscribe(MyEvent, () => t.pass());
  child.emitUp(new MyEvent(null));
});

test('should not emit on the child when propagation is stopped', t => {
  const Child = getRenderableClass();
  const myClass = getRenderable(MyClass);    
  const child = getRenderable(Child);
  
  (<any>myClass)._contentItems = [ child ];
  (<any>child)._container = myClass;

  const event =  new MyEvent(null);
  event.stopPropagation();
  
  myClass.subscribe(MyEvent, () => t.fail());
  child.emitUp(event);
});

test('should get all descendants', t => {
  const myClass = getRenderable(MyClass);    
  const child = getRenderable(MyClass);
  const grandChild = getRenderable(MyClass);
  
  (<any>myClass)._contentItems = [ child ];
  (<any>child)._contentItems = [ grandChild ];

  const results = myClass.getDescendants();

  t.is(results.length, 2);
  t.is(results[0], child);
  t.is(results[1], grandChild);
});

test('replacing a child', t => {
  const renderer = {} as any;
  const myClass = getRenderable(MyClass);
  const item = getRenderable(MyClass);
  const otherItem = getRenderable(MyClass);

  const setContainer = stub(otherItem, 'setContainer');
  const destroy = stub(item, 'destroy');
  const resize = stub(myClass, 'resize');
  renderer.render = spy();

  (<any>myClass)._renderer = renderer;
  (<any>myClass)._contentItems = [ item ];
  myClass.replaceChild(item, otherItem);

  t.is(myClass.getChildren()[0], otherItem);
  t.true(setContainer.calledOnce);
  t.is(setContainer.firstCall.args[0], myClass);
  t.false(destroy.called);
  t.true(resize.called);
  t.true(renderer.render.called);

  (<any>myClass)._contentItems = [ item ];
  
  renderer.render.reset();
  myClass.replaceChild(item, otherItem, { destroy: true, render: false });
  
  t.true(destroy.called);
  t.false(renderer.render.called);
});

test('adding a child', t => {
  const renderer = {} as any;
  const myClass = getRenderable(MyClass);
  const item = getRenderable(MyClass);
  const otherItem = getRenderable(MyClass);

  const setContainer = stub(item, 'setContainer');
  const resize = stub(myClass, 'resize');
  renderer.render = spy();

  (<any>myClass)._renderer = renderer;
  (<any>myClass)._contentItems = [ otherItem ];
  myClass.addChild(item);

  let children = myClass.getChildren();

  t.is(children.length, 2);
  t.is(children[0], otherItem);
  t.is(children[1], item);
  t.true(setContainer.calledOnce);
  t.is(setContainer.firstCall.args[0], myClass);
  t.true(resize.called);
  t.true(renderer.render.called);

  (<any>myClass)._contentItems = [ otherItem ];
  
  renderer.render.reset();
  resize.reset();
  myClass.addChild(item, { index: 0, render: false, resize: false });
  
  children = myClass.getChildren();
  
  t.false(resize.called);
  t.false(renderer.render.called);
  t.is(children[0], item);
  t.is(children[1], otherItem);
});

test('removing a child', t => {
  const renderer = {} as any;
  const myClass = getRenderable(MyClass);
  const item = getRenderable(MyClass);
  const otherItem = getRenderable(MyClass);

  let destroy = stub(item, 'destroy');
  const resize = stub(myClass, 'resize');
  const remove = stub(myClass, 'remove');
  renderer.render = spy();

  (<any>myClass)._renderer = renderer;
  (<any>myClass)._contentItems = [ item, otherItem ];
  myClass.removeChild(item);

  let children = myClass.getChildren();

  t.is(children.length, 1);
  t.is(children[0], otherItem);
  t.true(destroy.called);
  t.true(resize.called);
  t.true(renderer.render.called);
  t.false(remove.called);

  (<any>myClass)._contentItems = [ otherItem ];
  
  renderer.render.reset();
  resize.reset();
  myClass.removeChild(otherItem, { render: false, destroy: false });
  
  children = myClass.getChildren();
  
  t.false(resize.called);
  t.false(renderer.render.called);
  t.true(remove.called);
});

test('remove item', t => {
  const myClass = getRenderable(MyClass);  
  const parent = getRenderable(MyClass);
  const removeChildStub = stub(parent, 'removeChild');
  const destroyStub = stub(myClass, 'destroy');

  (<any>myClass)._container = parent;

  myClass.remove();
  t.true(removeChildStub.called);
  t.false(destroyStub.called);

  removeChildStub.reset();
  
  (<any>myClass)._container = null;
  
  myClass.remove();
  t.false(removeChildStub.called);
  t.true(destroyStub.called);
});

test('get index of item', t => {
  const item = getRenderable(MyClass);
  const myClass = getRenderable(MyClass);

  t.is(myClass.getIndexOf(item), -1);
  
  (<any>myClass)._contentItems = [ item ];

  t.is(myClass.getIndexOf(item), 0);
});

test('get item at index', t => {
  const item = getRenderable(MyClass);
  const myClass = getRenderable(MyClass);

  t.is(myClass.getAtIndex(0), null);
  
  (<any>myClass)._contentItems = [ item ];

  t.is<any>(myClass.getAtIndex(0), item);
});

test('scoping events', t => {
  t.plan(1);
  class OtherEvent extends BusEvent<any> {}
  
  const myClass = new MyClass();
  myClass.scope(MyEvent).subscribe(() => t.pass());

  myClass.emit(new MyEvent(null));
  myClass.emit(new OtherEvent(null));
});

test('contains item', t => {
  const item = getRenderable(MyClass);
  const myClass = getRenderable(MyClass);

  (<any>myClass)._contentItems = [ item ];

  t.true(myClass.contains(item));
  t.false(item.contains(myClass));
});

test('is contained within item', t => {
  const item = getRenderable(MyClass);
  const myClass = getRenderable(MyClass);

  (<any>myClass)._contentItems = [ item ];

  t.false(myClass.isContainedWithin(item));
  t.true(item.isContainedWithin(myClass));
});

test('is contained within item', t => {
  const myClass = getRenderable(MyClass);

  Object.assign(myClass, {
    _width: 20,
    _height: 10,
    _container: {
      offsetX: 50,
      offsetY: 50
    }
  });

  const area = myClass.getArea();

  t.true(area instanceof RenderableArea);
  t.is(area.x, 50);
  t.is(area.x2, 70);
  t.is(area.y, 50);
  t.is(area.y2, 60);
});

test('is droppable', t => {
  const myClass = getRenderable(MyClass);  

  t.false(myClass.isDroppable({} as any));
});