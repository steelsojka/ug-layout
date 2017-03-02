import { Injector, ProviderArg } from '../../src/di';
import { Renderer } from '../../src/dom';

export function createRenderableInjector(providers: ProviderArg[] = []): Injector {
  return new Injector([
    { provide: Renderer, useValue: {} },
    ...providers
  ]);
}