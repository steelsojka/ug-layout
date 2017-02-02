import { Injector } from './di';
import { DOMRenderer } from './dom';
import { DocumentRef } from './common';

export class RootInjector extends Injector {
  constructor() {
    super([
      DOMRenderer,
      { provide: DocumentRef, useValue: document }
    ]);
  }
}