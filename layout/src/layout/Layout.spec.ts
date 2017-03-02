import test from 'ava';
import { stub, spy } from 'sinon';
import { Subject } from 'rxjs/Subject'

import { Injector } from '../di';
import { Layout } from './Layout';
import { ConfigurationRef, ContainerRef } from '../common';
import { DragHost } from '../DragHost';
import { Renderable, RenderableInjector, ConfiguredRenderable, Renderer } from '../dom';
import { createRenderableInjector } from '../../test/unit/helpers';

let stubs;

RenderableInjector.fromRenderable = () => {
  return new Injector([
    { provide: ConfiguredRenderable, useValue: stubs.contentItem }
  ]);
};

function getInjector(config = {}): Injector {
  return createRenderableInjector([
    { provide: DragHost, useValue: stubs.dragHost },
    { provide: ContainerRef, useValue: stubs.container },
    { provide: ConfigurationRef, useValue: { child: {} } },
  ]);
}

function getLayout(injector = getInjector()): Layout {
  return injector.resolveAndInstantiate(Layout) as Layout;
}

test.beforeEach(() => {
  stubs = {
    dragHost: {
      start: new Subject(),
      destroy: spy(),
      setDropAreas: spy()
    },
    container: {},
    contentItem: {
      destroy: spy(),
      render: spy()
    }
  };
});

test('throw an error if missing config', t => {
  const injector = getInjector();

  injector.registerProvider({ provide: ConfigurationRef, useValue: null });
  t.throws(() => getLayout(injector));
  
  injector.registerProvider({ provide: ConfigurationRef, useValue: {} });
  t.throws(() => getLayout(injector));
});

test('create the layout', t => {
  t.true(getLayout() instanceof Layout);
});

test('create configured content item', t => {
  const layout = getLayout();
  
  t.is((<any>layout)._contentItems[0], stubs.contentItem);
});

test('getting the height', t => {
  const layout = getLayout();

  (<any>layout)._container = { height: 50 };
  t.is(layout.height, 50);
});

test('getting the width', t => {
  const layout = getLayout();

  (<any>layout)._container = { width: 50 };
  t.is(layout.width, 50);
});

test('rendering', t => {
  const layout = getLayout();

  Object.assign(layout, {
    _container: {
      height: 25,
      width: 50
    }  
  });
  
  const vnode = layout.render();
  
  t.is((<any>vnode.children).length, 1);
  t.is(vnode.sel, 'div.ug-layout__layout');
  t.deepEqual((<any>vnode.data).style, {
    height: '25px',
    width: '50px'    
  });
});

test('destroying', t => {
  const layout = getLayout();
  const superStub = stub(Renderable.prototype, 'destroy');

  layout.destroy();

  t.true(stubs.dragHost.destroy.called);
  t.true(superStub.called);
});

test('getting item visible areas', t => {
  const layout = getLayout();
  const desc = [
    { isVisible: () => true, getArea: () => ({ x: 2, y: 5 }) },
    { isVisible: () => false, getArea: () => ({ x: 12, y: 15 }) }
  ];
  
  layout.getDescendants = () => desc as any;
  const results = layout.getItemVisibleAreas();

  t.is(results.length, 1);
  t.deepEqual<any>(results[0], {
    item: desc[0],
    area: { x: 2, y: 5 }
  });
});

test('when dragging starts', t => {
  const item = {};
  const dropTargets = [];
  const layout = Object.assign(getLayout(), {
    _container: {
      width: 100,
      height: 150,
      offsetX: 5,
      offsetY: 10
    },
    _getDropTargets: () => dropTargets  
  }) as Layout;

  const dragContainer = {
    item,
    dragArea: {
      width: 20,
      height: 25
    }
  };

  (<any>layout)._onDragHostStart(dragContainer);

  t.is(stubs.dragHost.bounds.x, 5);
  t.is(stubs.dragHost.bounds.y, 10);
  t.is(stubs.dragHost.bounds.x2, 85);
  t.is(stubs.dragHost.bounds.y2, 135);
  
  t.true(stubs.dragHost.setDropAreas.called);
  t.is(stubs.dragHost.setDropAreas.firstCall.args[0], dropTargets);
});