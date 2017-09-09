import { Type } from '../di';
import { Renderable } from './Renderable'
import { RenderableArg } from '../common';
import { isFunction } from '../utils';

/**
 * A container that holds a Renderable class and a configuration to
 * use when it is instanatiated.
 * @export
 * @class ConfiguredRenderable
 * @template T A subclass of a renderable.
 * @example
 * class MyClass {}
 * 
 * const configured = new ConfiguredRenderable(MyClass, { configProp: true });
 * 
 * ConfiguredRenderable.resolve(configured); // => MyClass
 * ConfiguredRenderable.resolveConfiguration(configured); // => { configProp: true }
 */
export class ConfiguredRenderable<T extends Renderable> {
  /**
   * Creates an instance of ConfiguredRenderable.
   * @param {Type<T>} _renderable 
   * @param {*} _config 
   */
  constructor(
    private _renderable: Type<T>, 
    private _config: any
  ) {}

  /**
   * The renderable to instantiate.
   * @readonly
   * @type {Type<T>}
   */
  get renderable(): Type<T> {
    return this._renderable;
  }

  /**
   * The configuration for the renderable.
   * @readonly
   * @type {*}
   */
  get config(): any {
    return this._config;
  }

  /**
   * Resolves a renderable class from a configured renderable or renderable instance.
   * @static
   * @template T The renderable subclass.
   * @param {(Type<T>|ConfiguredRenderable<T>|T)} item 
   * @returns {Type<T>} 
   */
  static resolve<T extends Renderable>(item: Type<T>|ConfiguredRenderable<T>|T): Type<T> {
    if (item instanceof ConfiguredRenderable) {
      return item._renderable;
    }  

    if (item instanceof Renderable) {
      return item.constructor as Type<T>;
    }

    return item;
  }

  static isRenderableArg<T>(config: any): config is RenderableArg<T> {
    return config instanceof ConfiguredRenderable || isFunction(config) || config instanceof Renderable;
  }

  static isRenderableConstructor<T>(arg: any): arg is ConfiguredRenderable<T>|Type<T> {
    return ConfiguredRenderable.isRenderableArg(arg) && !(arg instanceof Renderable);
  }

  /**
   * Resolves a configuration from a configured renderable.
   * @static
   * @param {(ConfiguredRenderable<any>|any)} item 
   * @returns {*} 
   */
  static resolveConfiguration(item: ConfiguredRenderable<any>|any): any {
    if (item instanceof ConfiguredRenderable) {
      return item.config;
    }

    return item;
  }

  /**
   * Determines whether a resolved renderable is within a list of resolved renderables.
   * @static
   * @param {RenderableArg<Renderable>[]} list 
   * @param {RenderableArg<Renderable>} item 
   * @returns {boolean} 
   */
  static inList(list: RenderableArg<Renderable>[], item: RenderableArg<Renderable>): boolean {
    const resolved = ConfiguredRenderable.resolve(item);
    
    for (const _item of list) {
      if (ConfiguredRenderable.resolve(_item) === resolved) {
        return true;
      }
    }

    return false;
  }
}