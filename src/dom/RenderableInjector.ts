import { Provider, Injector, Type } from '../di';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { ConfigurationRef } from '../common';
import { Renderable } from './Renderable';

export class RenderableInjector extends Injector {
  static fromRenderable(
    renderable: Type<Renderable>|ConfiguredRenderable<Renderable>, 
    providers: Provider[] = [],
    parent?: Injector
  ): RenderableInjector {
    let Ctor = renderable;
    let config: any = null;
    
    if (renderable instanceof ConfiguredRenderable) {
      Ctor = renderable.renderable;
      config = renderable.config;
    }

    return Injector.fromInjectable(Ctor as Type<Renderable>, [
      { provide: ConfiguredRenderable, useClass: Ctor },
      { provide: ConfigurationRef, useValue: config },
      ...providers
    ], parent);
  }
}