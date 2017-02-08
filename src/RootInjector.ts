import { Injector } from './di';
import { Renderer } from './dom';
import { ViewFactory, ViewManager } from './view';
import { DocumentRef } from './common';

export class RootInjector extends Injector {
  constructor() {
    super([
      Renderer,
      ViewFactory,
      ViewManager,
      { provide: DocumentRef, useValue: document }
    ]);
  }
}