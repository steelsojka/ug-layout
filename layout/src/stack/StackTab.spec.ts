import test from 'ava';
import { stub } from 'sinon';
import { Subject } from '../events';

import { StackTab } from './StackTab';
import { Draggable } from '../Draggable';
import { DragHost } from '../DragHost';
import { DocumentRef } from '../common';
import { Renderable } from '../dom';
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

test('render', t => {
  const tab = getTab();    
  const item = {
    title: 'title',
    draggable: true
  };

  Object.assign(tab, {
    _container: {
      isHorizontal: true,
      isDistributed: false,
      isTabActive: () => true  
    }  
  });

  stub(tab, '_getStyles').returns({});
  stub(tab, 'item', { get: () => item });
});