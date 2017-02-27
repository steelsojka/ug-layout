import { Injector, ProviderArg, forwardRef } from './di';
import { Renderer, RenderableInjector } from './dom';
import { ViewFactory, ViewManager } from './view';
import { DocumentRef } from './common';

export class RootInjector extends RenderableInjector {
  constructor(providers: ProviderArg[] = []) {
    super([
      Renderer,
      ViewFactory,
      ViewManager,
      { provide: DocumentRef, useValue: document },
      { provide: RootInjector, useValue: forwardRef(() => this) },
      ...providers
    ]);
  }
}