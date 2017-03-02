import test from 'ava';

import * as utils from './index';

test('isNumber', t => {
  t.true(utils.isNumber(10));
  t.false(utils.isNumber('test'));
  t.false(utils.isNumber({}));
  t.false(utils.isNumber(null));
});

test('isString', t => {
  t.true(utils.isString('test'));
  t.false(utils.isString(0));
  t.false(utils.isString({}));
  t.false(utils.isString(null));
});

test('clamp', t => {
  t.is(utils.clamp(5, 10, 15), 10);
  t.is(utils.clamp(13, 10, 15), 13);
  t.is(utils.clamp(20, 10, 15), 15);
});

test('isObject', t => {
  t.true(utils.isObject({}));
  t.true(utils.isObject([]));
  t.false(utils.isObject(0));
  t.false(utils.isObject(true));
  t.false(utils.isObject('true'));
  t.false(utils.isObject(null));
});

test('isFunction', t => {
  t.true(utils.isFunction(function() {}));
  t.false(utils.isFunction({}));
  t.false(utils.isFunction([]));
  t.false(utils.isFunction(0));
  t.false(utils.isFunction(true));
  t.false(utils.isFunction('true'));
  t.false(utils.isFunction(null));
});

test('isBoolean', t => {
  t.true(utils.isBoolean(true));
  t.false(utils.isBoolean(function() {}));
  t.false(utils.isBoolean({}));
  t.false(utils.isBoolean([]));
  t.false(utils.isBoolean(0));
  t.false(utils.isBoolean('true'));
  t.false(utils.isBoolean(null));
});

test('isUndefined', t => {
  t.true(utils.isUndefined(undefined));
  t.false(utils.isUndefined(true));
  t.false(utils.isUndefined(function() {}));
  t.false(utils.isUndefined({}));
  t.false(utils.isUndefined([]));
  t.false(utils.isUndefined(0));
  t.false(utils.isUndefined('true'));
  t.false(utils.isUndefined(null));
});

test('negate', t => {
  const stubTrue = () => true;
  
  t.true(stubTrue());
  t.false(utils.negate(stubTrue)());
});

test('get', t => {
  t.is(utils.get({ test: 'test' }, 'test'), 'test');
  t.is(utils.get({ test: { nested: { id: 123 } } }, 'test.nested.id'), 123);
  t.is(utils.get({ test: { nested: { id: 123 } } }, 'test.nested.id.cheese'), undefined);
  t.is(utils.get(null, 'test.nested.id.cheese'), undefined);
  t.is(utils.get(null, 'test.nested.id.cheese', 123), 123);
  t.is(utils.get({ test: { nested: { id: null } } }, 'test.nested.id', 123, v => v === null), 123);
});

test('propEq', t => {
  t.true(utils.propEq('test', 'blorg')({ test: 'blorg' }));
  t.false(utils.propEq('test', 'nope')({ test: 'blorg' }));
  t.false(utils.propEq('test', 'nope')(null));
});

test('eq', t => {
  t.true(utils.eq('test')('test'));
  t.false(utils.eq('test')('nope'));
});

test('round', t => {
  t.is(utils.round(5.1234, 2), 5.12);
  t.is(utils.round(5.1234), 5);
  t.is(utils.round(5.1236, 3), 5.124);
});

test('isPromise', t => {
  t.true(utils.isPromise(Promise.resolve()));
  t.false(utils.isPromise(true));
  t.false(utils.isPromise(function() {}));
  t.false(utils.isPromise({}));
  t.false(utils.isPromise([]));
  t.false(utils.isPromise(0));
  t.false(utils.isPromise('true'));
  t.false(utils.isPromise(null));
});

test('partition', t => {
  const items = [
    { id: 1 },
    { id: 2 },
    { id: 3 },
    { id: 4 },
    { id: 5 },
    { id: 6 }
  ];

  const results = utils.partition(items, i => i.id < 5);

  t.is(results[0].length, 4);
  t.is(results[1].length, 2);
  t.is(results[0][0].id, 1);
  t.is(results[0][1].id, 2);
  t.is(results[0][2].id, 3);
  t.is(results[0][3].id, 4);
  t.is(results[1][0].id, 5);
  t.is(results[1][1].id, 6);
});

test('defaults', t => {
  const obj = {
    test: 123,
    blorg: null
  };

  const defaults = {
    blorg: 546,
    key: 'test'  
  };

  t.deepEqual<any>(utils.defaults(obj, defaults), {
    test: 123,
    blorg: null,
    key: 'test'  
  });
});

test('uid', t => {
  t.true(utils.uid() !== utils.uid());
});