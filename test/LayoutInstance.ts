import 'reflect-metadata';

import { Injector, forwardRef } from '../src/di';
import { LayoutInstance } from '../src/LayoutInstance';

const injector = new Injector([
  LayoutInstance,
  { provide: Injector, useValue: forwardRef(() => injector) },
  { provide: 'test', useValue: 'blorg!' }
]);

const layout = injector.get(LayoutInstance);
const child = layout.spawn();

console.log(child._injector.get(Injector, undefined, { lazy: true })());