import { Injector, ProviderArg } from './di';
import { Renderer } from './dom';
import { ViewFactory, ViewManager } from './view';
import { DocumentRef } from './common';

export class RootInjector extends Injector {
  constructor(providers: ProviderArg[] = []) {
    super([
      Renderer,
      ViewFactory,
      ViewManager,
      { provide: DocumentRef, useValue: document },
      ...providers
    ]);
  }
}