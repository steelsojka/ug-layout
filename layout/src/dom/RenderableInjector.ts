import { ProviderArg, Injector, Type } from '../di';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { ConfigurationRef } from '../common';
import { Renderable } from './Renderable';
import { isFunction } from '../utils';

/**
 * Key used to assign the injector to on Renderables.
 * @see {@link RenderableInjector}
 * @type {string}
 */
export const INJECTOR_KEY = '__injector';

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
   * @param {{skipInit: ?boolean}} [options={}]
   * @returns {RenderableInjector} 
   */
  static fromRenderable(
    renderable: Type<Renderable>|ConfiguredRenderable<Renderable>|Renderable, 
    providers: ProviderArg[] = [],
    parent?: Injector,
    options: { skipInit?: boolean } = {}
  ): Injector {
    const { skipInit = false } = options;
    let Ctor = renderable;
    let config: any = null;
    let factory = (injector: Injector) => {
      const instance = injector.resolveAndInstantiate(Ctor) as Renderable;

      instance[INJECTOR_KEY] = injector;

      if (isFunction(instance.initialize) && skipInit !== true) {
        instance.initialize();
      }

      return instance;
    };
    
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
      { provide: ConfiguredRenderable, useFactory: factory, deps: [ Injector ] },
      { provide: ConfigurationRef, useValue: config },
      ...providers
    ], parent);
  }
}