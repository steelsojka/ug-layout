import test from 'ava';

import { RenderableArea } from './RenderableArea';

let area: RenderableArea;

test.beforeEach(t => {
  area = new RenderableArea(25, 50, 50, 150);
});

test('correct values', t => {
  t.is(area.height, 100);
  t.is(area.width, 25);
  t.is(area.x, 25);
  t.is(area.x2, 50);
  t.is(area.y, 50);
  t.is(area.y2, 150);
  t.is(area.surface, 2500);
});

test('clamping values', t => {
  t.is(area.clampX(10), 25) ;
  t.is(area.clampX(100), 50) ;
  t.is(area.clampY(10), 50) ;
  t.is(area.clampY(500), 150) ;
});

test('recalculating values', t => {
  area.x = 35;
  area.y = 100;
  
  t.is(area.height, 50);
  t.is(area.width, 15);
  t.is(area.surface, 750);
});