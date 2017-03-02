import { Injector, ProviderArg } from '../../src/di';
import { Renderer, Renderable } from '../../src/dom';

export function createRenderableInjector(providers: ProviderArg[] = []): Injector {
  return new Injector([
    { provide: Renderer, useValue: {} },
    ...providers
  ]);
}

export function getRenderableClass(providers: ProviderArg[] = []): { new (): Renderable } {
  class MockRenderable extends Renderable {
    constructor() {
      super(createRenderableInjector(providers));
    }

    render(): any {}
  }

  return MockRenderable;
}