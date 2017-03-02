import { Provider, Injector, Type } from '../di';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { ConfigurationRef } from '../common';
import { Renderable } from './Renderable';

/**
 * An injector created for renderables.
 * @export
 * @class RenderableInjector
 * @extends {Injector}
 */
export class RenderableInjector extends Injector {
  /**
   * Creates an injector from a ConfiguredRenderable, a Renderable constructor or a Renderable instance.
   * The renderable is registered under the `ConfiguredRenderable` token and the configuration is under the
   * `ConfigurationRef` token.
   * @static
   * @param {(Type<Renderable>|ConfiguredRenderable<Renderable>|Renderable)} renderable 
   * @param {Provider[]} [providers=[]] 
   * @param {Injector} [parent] 
   * @returns {RenderableInjector} 
   */
  static fromRenderable(
    renderable: Type<Renderable>|ConfiguredRenderable<Renderable>|Renderable, 
    providers: Provider[] = [],
    parent?: Injector
  ): RenderableInjector {
    let Ctor = renderable;
    let config: any = null;
    
    if (renderable instanceof ConfiguredRenderable) {
      Ctor = renderable.renderable;
      config = renderable.config;
    } else if (renderable instanceof Renderable) {
      return new Injector([
        { provide: ConfiguredRenderable, useValue: renderable },
        { provide: ConfigurationRef, useValue: null },
        ...providers
      ]);
    }

    return Injector.fromInjectable(Ctor as Type<Renderable>, [
      { provide: ConfiguredRenderable, useClass: Ctor },
      { provide: ConfigurationRef, useValue: config },
      ...providers
    ], parent);
  }
}