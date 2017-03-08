import test from 'ava';
import { stub, spy } from 'sinon';

import { ConfigurationRef, ContainerRef } from '../common';
import { StackItemContainer } from './StackItemContainer';
import { getRenderable } from '../../test/unit/helpers';

function getItem(container = {}): StackItemContainer {
  return getRenderable(StackItemContainer, [
    { provide: ConfigurationRef, useValue: {} },
    { provide: ContainerRef, useValue: container }  
  ]);
}

test('get tab', t => {
  const tab = {};
  const _stub = stub().returns(tab);
  const indexStub = stub().returns(1);
  const item = getItem({
    getTabAtIndex: _stub,
    getIndexOf: indexStub
  });    

  const result = item.tab;

  t.is<any>(result, tab);
  t.is(_stub.args[0][0], 1);
  t.is(indexStub.args[0][0], item);
});

function getSizeTest(t, { horz, size, prop }, expected) {
  const item = getItem({
    [prop]: size,
    isHorizontal: horz,
    header: {
      [prop]: 10
    }  
  });

  t.is(item[prop], expected);
}

test('get width, horizontal', getSizeTest, { horz: true, size: 50, prop: 'width' }, 50);
test('get width, not horizontal', getSizeTest, { horz: false, size: 50, prop: 'width' }, 40);
test('get width, not horizontal w/ header to large', getSizeTest, { horz: false, size: 5, prop: 'width' }, 0);
test('get height, horizontal', getSizeTest, { horz: true, size: 50, prop: 'height' }, 40);
test('get height, not horizontal', getSizeTest, { horz: false, size: 50, prop: 'height' }, 50);
test('get height, horizontal w/ header to large', getSizeTest, { horz: true, size: 5, prop: 'height' }, 0);

test('isActiveContainer', t => {
  const _stub = stub();
  const item = getItem({
    isActiveContainer: _stub
  });

  _stub.returns(true);
  t.true(item.isActive);
  t.is(_stub.args[0][0], item);
  
  _stub.returns(false);
  t.false(item.isActive);
});

function offsetTest(t, { horz, rev, prop }, expected) {
  const item = getItem({
    offsetY: 150,
    offsetX: 100,
    isHorizontal: horz,
    isReversed: rev,
    header: {
      height: 5,
      width: 10
    }  
  });

  t.is(item[prop], expected);
}

(<any>offsetTest).title = (provided, args) => {
  let result = args.prop;

  result += args.horz ? ', horizontal' : ', not horizontal';
  result += args.rev ? ', reversed' : ', not reversed';

  return result;
};

test(offsetTest, { horz: true, rev: false, prop: 'offsetY' }, 155);
test(offsetTest, { horz: true, rev: true, prop: 'offsetY' }, 150);
test(offsetTest, { horz: false, rev: true, prop: 'offsetY' }, 150);
test(offsetTest, { horz: false, rev: false, prop: 'offsetX' }, 110);
test(offsetTest, { horz: true, rev: false, prop: 'offsetX' }, 100);
test(offsetTest, { horz: false, rev: true, prop: 'offsetX' }, 100);