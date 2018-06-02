import test from 'ava';
import { stub, spy } from 'sinon';
import { Subject } from 'rxjs';

import { TabDragEvent } from './TabDragEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { StackTab } from './StackTab';
import { Draggable } from '../Draggable';
import { DragHost } from '../DragHost';
import { DocumentRef, ContextType } from '../common';
import { Renderable, RenderableArea } from '../dom';
import { getRenderable } from '../../test/unit/helpers';

let stubs;

function getTab(): StackTab {
  return getRenderable(StackTab, [
    { provide: Draggable, useValue: stubs.draggable },
    { provide: DragHost, useValue: stubs.dragHost },
    { provide: DocumentRef, useValue: stubs.document }
  ]);
}

test.beforeEach(() => {
  stubs = {
    draggable: {},
    dragHost: {},
    document: {}
  };
});

test('getting width', t => {
  const tab = getTab();

  Object.assign(tab, {
    _width: 50,
    _container: {
      isHorizontal: true
    }
  });

  t.is(tab.width, 50);

  Object.assign(tab, {
    _container: {
      isHorizontal: false,
      width: 100
    }
  });

  t.is(tab.width, 100);
});

test('getting height', t => {
  const tab = getTab();

  Object.assign(tab, {
    _height: 50,
    _container: {
      isHorizontal: false
    }
  });

  t.is(tab.height, 50);

  Object.assign(tab, {
    _container: {
      isHorizontal: true,
      height: 100
    }
  });

  t.is(tab.height, 100);
});

test('getting the stack item', t => {
  const tab = getTab();
  const item = {};

  Object.assign(tab, {
    _container: {
      getItemFromTab: () => item
    }
  });

  t.is<any>(tab.item, item);
});

test('getting the offsetX', t => {
  const tab = getTab();
  const offset = 100;

  Object.assign(tab, {
    _container: {
      getOffsetXForTab: () => offset
    }
  });

  t.is<any>(tab.offsetX, 100);
});

test('getting the offsetY', t => {
  const tab = getTab();
  const offset = 100;

  Object.assign(tab, {
    _container: {
      getOffsetYForTab: () => offset
    }
  });

  t.is<any>(tab.offsetY, 100);
});

test('getting the stack', t => {
  const tab = getTab();
  const stack = {};

  Object.assign(tab, {
    _container: {
      container: stack
    }
  });

  t.is<any>(tab.stack, stack);

  Object.assign(tab, {
    _container: undefined
  });

  t.is<any>(tab.stack, null);
});

test('getting controls', t => {
  const tab = getTab();
  const item = {
    controls: []
  };

  Object.assign(tab, {
    _container: {
      getItemFromTab: () => item
    }
  });

  t.is(tab.controls, item.controls);
});

test('initializing', t => {
  const drag = new Subject();
  const dragHostStart = new Subject();
  const dragHostDrop = new Subject();

  Object.assign(stubs.draggable, { drag });
  Object.assign(stubs.dragHost, {
    start: dragHostStart,
    dropped: dragHostDrop
  });

  const tab = getTab();
  const dragStopStub = stub(tab, '_onDragStop');
  const dragStub = stub(tab, '_onDragMove');
  const dragStartStub = stub(tab, '_onDragStart');
  const dragHostStartStub = stub(tab, '_onDragHostStart');
  const dragHostDropStub = stub(tab, '_onDragHostDropped');

  Object.assign(Draggable, {
    isDraggingEvent: n => n === 0,
    isDragStopEvent: n => n === 1,
    isDragStartEvent: n => n === 2
  });

  stub(Renderable.prototype, 'initialize');

  tab.initialize();

  drag.next(0);
  drag.next(1);
  drag.next(2);
  dragHostStart.next();
  dragHostDrop.next();

  t.is(dragStopStub.callCount, 1);
  t.is(dragStub.callCount, 1);
  t.is(dragStartStub.callCount, 1);
  t.is(dragHostStartStub.callCount, 1);
  t.is(dragHostDropStub.callCount, 1);
});

test('resizing', t => {
  const tab = getTab();

  stub(tab, '_resizeHashId', { get: () => 1234 });

  (<any>tab)._element = {
    getBoundingClientRect: () => ({ width: 10, height: 20 })
  };

  tab.resize();

  t.is((<any>tab)._width, 10);
  t.is((<any>tab)._height, 20);
});

test.todo('render');

test('destroy', t => {
  const tab = getTab();
  const destroyStub = stub();
  const superStub = stub(Renderable.prototype, 'destroy');

  Object.assign(tab, {
    _draggable: { destroy: destroyStub }
  });

  tab.destroy({ type: ContextType.NONE });

  t.true(destroyStub.called);
  t.true(superStub.called);
});

// private _getStyles
function testGetStyles(t, config, expected): void {
  const tab = getTab();

  stub(tab, 'width', { get: () => 15 });
  stub(tab, 'height', { get: () => 5 });

  Object.assign(tab, {
    _config: {
      maxSize: 10
    },
    _container: {
      isHorizontal: config.horz,
      isDistributed: config.dist,
      width: 100,
      height: 150
    }
  });

  const result = (<any>tab)._getStyles();

  t.deepEqual(result, expected);
}

test('get styles horizontal, not distributed', testGetStyles, {
  horz: true,
  dist: false
}, {
  'max-width': '10px',
  'max-height': '150px',
  'height': '5px'
});

test('get styles horizontal, distributed', testGetStyles, {
  horz: true,
  dist: true
}, {
  'max-height': '150px',
  'height': '5px'
});

test('get styles vertical, not distributed', testGetStyles, {
  horz: false,
  dist: false
}, {
  'max-height': '10px',
  'max-width': '100px',
  'width': '15px'
});

test('get styles vertical, distributed', testGetStyles, {
  horz: false,
  dist: true
}, {
  'max-width': '100px',
  'width': '15px'
});

// _onMouseDown
test('dragging on mouse down', t => {
  const tab = getTab();
  const item = { draggable: false };
  const startDragSpy = spy();

  Object.assign(tab, {
    _draggable: { startDrag: startDragSpy }
  });

  stub(tab, 'item', { get: () => item });

  (<any>tab)._onMouseDown({ pageX: 15, pageY: 20 });

  t.false(startDragSpy.called);

  item.draggable = true;
  (<any>tab)._onMouseDown({ pageX: 15, pageY: 20 });

  t.true(startDragSpy.called);
  t.deepEqual(startDragSpy.args[0][0], {
    host: tab,
    startX: 15,
    startY: 20
  });
});

// _onDragStart
test('on drag start', t => {
  const tab = getTab();
  const item = {};
  const stack = {} as any;
  const area = {};
  const fail = new Subject();
  const dropped = new Subject();

  const dragEventSpy = spy();
  const dragHostInitSpy = spy();
  const addChildSpy = spy();
  const classListAddSpy = spy();
  const appendChildSpy = spy();

  stack.addChild = addChildSpy;
  stub(tab, 'stack', { get: () => stack });
  stub(tab, 'getArea').returns(area);

  const destroyStub = stub(tab, 'destroy');

  Object.assign(tab, {
    _draggable: {},
    _document: {
      body: { appendChild: appendChildSpy }
    },
    _element: {
      classList: { add: classListAddSpy }
    },
    _container: {
      getItemFromTab: () => item,
      getIndexOf: () => 0
    },
    _dragHost: {
      fail, dropped,
      initialize: dragHostInitSpy
    }
  });

  tab.subscribe(TabDragEvent, dragEventSpy);

  (<any>tab)._onDragStart({});

  t.true(tab.isDragging);
  t.true(dragEventSpy.called);
  t.true(dragEventSpy.args[0][0] instanceof TabDragEvent);
  t.true(classListAddSpy.called);
  t.is(classListAddSpy.args[0][0], 'ug-layout__tab-dragging');
  t.true(appendChildSpy.called);
  t.is(appendChildSpy.args[0][0], (<any>tab)._element);
  t.true(dragHostInitSpy.called);
  t.deepEqual(dragHostInitSpy.args[0][0], {
    item,
    draggable: (<any>tab)._draggable,
    dragArea: area
  });
  t.false(destroyStub.called);

  fail.next();

  t.true(addChildSpy.called);
  t.is(addChildSpy.args[0][0], item);
  t.deepEqual(addChildSpy.args[0][1], { index: 0 });
  t.false(destroyStub.called);

  dropped.next();

  t.true(destroyStub.called);
});

test('on drag move', t => {
  const tab = getTab();
  const bounds = new RenderableArea(0, 250, 0, 50);

  stub(tab, 'width', { get: () => 30 });
  stub(tab, 'height', { get: () => 60 });

  Object.assign(tab, {
    _dragHost: {
      bounds
    },
    _element: {
      style: {}
    }
  });

  (<any>tab)._onDragMove({ pageX: 200, pageY: 200 });

  t.is((<any>tab)._element.style.transform, 'translateX(185px) translateY(50px)');
});

test('on drag stop', t => {
  const tab = getTab();
  const removeSpy = spy();
  const removeChildSpy = spy();

  Object.assign(tab, {
    _isDragging: true,
    _element: {
      style: {},
      classList: {
        remove: removeSpy
      }
    },
    _document: {
      body: {
        removeChild: removeChildSpy
      }
    }
  });

  (<any>tab)._onDragStop({});

  t.false(tab.isDragging);
  t.is((<any>tab)._element.style.transform, 'translateX(0px) translateY(0px)');
  t.true(removeSpy.called);
  t.is(removeSpy.args[0][0], 'ug-layout__tab-dragging');
  t.true(removeChildSpy.called);
  t.is(removeChildSpy.args[0][0], (<any>tab)._element);
});

test('on drag host start', t => {
  const tab = getTab();
  const addSpy = spy();

  Object.assign(tab, {
    _element: {
      classList: { add: addSpy }
    }
  });

  (<any>tab)._onDragHostStart();

  t.true(addSpy.called);
  t.is(addSpy.args[0][0], 'ug-layout__tab-drag-enabled');
});

test('on drag host dropped', t => {
  const tab = getTab();
  const removeSpy = spy();

  Object.assign(tab, {
    _element: {
      classList: { remove: removeSpy }
    }
  });

  (<any>tab)._onDragHostDropped();

  t.true(removeSpy.called);
  t.is(removeSpy.args[0][0], 'ug-layout__tab-drag-enabled');
});

test('on tab click', t => {
  const tab = getTab();
  const _spy = spy();

  tab.subscribe(TabSelectionEvent, _spy);

  (<any>tab)._onClick();

  t.true(_spy.called);
  t.true(_spy.args[0][0] instanceof TabSelectionEvent);
});