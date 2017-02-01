import { Provider, Injector } from '../di';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { Renderable } from './common';
import { ConfigurationRef, Type } from '../common';

export class RenderableInjector extends Injector {
  static fromRenderable(
    renderable: Type<Renderable>|ConfiguredRenderable<Renderable>, 
    providers: Provider[] = [],
    parent?: Injector
  ): RenderableInjector {
    providers.push({
      provide: ConfiguredRenderable,
      useClass: renderable instanceof ConfiguredRenderable 
        ? renderable.renderable 
        : renderable
    }, {
      provide: ConfigurationRef,
      useValue: renderable instanceof ConfiguredRenderable
        ? renderable.config 
        : null
    });

    return new RenderableInjector(providers, parent);
  }
}