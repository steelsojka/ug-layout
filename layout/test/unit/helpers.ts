import { Type, Injector, ProviderArg } from '../../src/di';
import { ConfiguredRenderable, Renderer, Renderable, RenderableInjector } from '../../src/dom';

export function createRenderableInjector(providers: ProviderArg[] = []): Injector {
  return new Injector([
    { provide: Renderer, useValue: {} },
    ...providers
  ]);
}

export function getRenderable<T>(Ctor: Type<T>, providers: ProviderArg[] = []): T {
  return RenderableInjector.fromRenderable(
    Ctor as any,
    providers,
    undefined,
    { skipInit: true }
  )
    .get(ConfiguredRenderable);
}

export function getRenderableClass(): { new (): Renderable } {
  class MockRenderable extends Renderable {
    render(): any {}
  }

  return MockRenderable;
}