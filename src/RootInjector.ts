import { Injector } from './di';
import { Renderer } from './dom';
import { DocumentRef } from './common';

export class RootInjector extends Injector {
  constructor() {
    super([
      Renderer,
      { provide: DocumentRef, useValue: document }
    ]);
  }
}