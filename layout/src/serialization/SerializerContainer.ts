import { Injector, Type } from '../di';
import { Renderable } from '../dom';
import { Serializer, Serialized } from './common';
import { isFunction, isString } from '../utils';
import { RenderableConstructorArg } from '../common';

export interface Constructable<T> {
  constructor: Function;
}

export type BaseSerializer = Serializer<Renderable, Serialized>;

export interface SerializerContainerConfig {
  /**
   * An injector to use as the parent injector.
   * @type {Injector}
   */
  injector?: Injector;
}

/**
 * A container for running and determining serializers.
 * @export
 * @class SerializerContainer
 * @example
 * 
 * const container = new SerializerContainer();
 * 
 * class MyClass {}
 * 
 * const mySerializer = new GenericSerializer('MyClass', MyClass);
 * 
 * container.registerSerializer(MyClass, mySerializer);
 * container.serialize(new MyClass()); // => { name: 'MyClass' }
 * container.deserialize({ name: 'MyClass' }); // => MyClass
 */
export class SerializerContainer {
  protected _injector;
  protected _serializers: Map<Type<any>, BaseSerializer|Type<BaseSerializer>> = new Map();
  protected _classToStringMap: Map<Type<any>, string> = new Map();

  /**
   * Creates an instance of SerializerContainer.
   * @param {SerializerContainerConfig} [config={}] 
   */
  constructor(config: SerializerContainerConfig = {}) {
    this._injector = new Injector([], config.injector || null);
    this._injector.registerProvider({ provide: SerializerContainer, useValue: this });
  }

  /**
   * Registers a serializer with the container.
   * @param {Type<any>} _Class 
   * @param {(BaseSerializer|Type<BaseSerializer>)} serializer 
   * @param {{ skipRegister?: boolean }} [options={}] 
   */
  registerSerializer(_Class: Type<any>, serializer: BaseSerializer|Type<BaseSerializer>, options: { skipRegister?: boolean } = {}): void {
    const { skipRegister = false } = options;
    
    this._serializers.set(_Class, serializer);
    this._injector.registerProvider(isFunction(serializer) ? serializer : { provide: serializer, useValue: serializer });

    if (!skipRegister && isFunction(serializer['register'])) {
      serializer['register'](this);
    }
  }

  /**
   * Registers a class that can be identified by a string representation.
   * @param {string} name 
   * @param {Type<any>} _Class 
   */
  registerClass(name: string, _Class: Type<any>): void {
    this._classToStringMap.set(_Class, name);
    this._injector.registerProvider({ provide: name, useValue: _Class });
  }
  
  /**
   * Registers multiple classes that can be identified by a string representation.
   * @param {{ [key:string]: Type<any> }} [classes={}] 
   */
  registerClasses(classes: { [key:string]: Type<any> } = {}): void {
    for (const key of Object.keys(classes)) {
      this.registerClass(key, classes[key]);
    }
  }

  /**
   * Resolves a class to it's registered string representation.
   * @param {Type<any>} _Class 
   * @returns {(string|null)} 
   */
  resolveClassString(_Class: Type<any>): string|null {
    return this._classToStringMap.get(_Class) || null;
  }

  /**
   * Resolves a serializer from a serialized node.
   * @param {Serialized} node 
   * @returns {(BaseSerializer|null)} 
   */
  resolveFromSerialized(node: Serialized): BaseSerializer|null {
    const _Class = this.resolveClass(node.name);

    if (_Class) {
      if (this._serializers.has(_Class)) {
        return this._injector.get(this._serializers.get(_Class));
      }
    }

    return null;
  }
  
  /**
   * Resolves a serializer from a class.
   * @param {Type<any>} _Class 
   * @returns {(BaseSerializer|null)} 
   */
  resolveFromClass(_Class: Type<any>): BaseSerializer|null {
    if (this._serializers.has(_Class)) {
      return this.resolve<BaseSerializer>(this._serializers.get(_Class));
    }

    return null;
  }

  /**
   * Resolves a serializer from an instance of a registered class.
   * @param {(Renderable & Constructable<any>)} instance 
   * @returns {(BaseSerializer|null)} 
   */
  resolveFromInstance(instance: Renderable & Constructable<any>): BaseSerializer|null {
    return this.resolveFromClass(instance.constructor as Type<any>);
  }

  /**
   * Resolves a string to a registered class.
   * @param {string} name 
   * @returns {(Type<any>|null)} 
   */
  resolveClass(name: string): Type<any>|null {
    return this.resolve<Type<any>>(name);
  }

  /**
   * Serializes a class instance using the registered serializer for that class.
   * @template R The class type.
   * @template S The serialized type.
   * @param {R} instance 
   * @returns {S} The serialized node.
   */
  serialize<R extends Renderable & Constructable<any>, S extends Serialized>(instance: R): S {
    const serializer = this.resolveFromInstance(instance) as Serializer<R, S>|null;

    if (!serializer) {
      throw new Error(`Serializer for class '${instance.constructor.name}' is not registered.`);
    }

    return serializer.serialize(instance);
  }
  
  /**
   * Deserializes a serialized node using the registered serializer for that node type.
   * @template R The class type.
   * @template S The serialized type.
   * @param {S} serialized 
   * @returns {R} The renderable argument.
   */
  deserialize<R extends Renderable, S extends Serialized>(serialized: S): RenderableConstructorArg<R> {
    const serializer = this.resolveFromSerialized(serialized) as Serializer<R, S>|null;

    if (!serializer) {
      throw new Error(`Serializer for node '${serialized.name}' is not registered.`);
    }

    return serializer.deserialize(serialized);
  }

  serializeList<R extends Renderable & Constructable<any>, S extends Serialized>(instances: R[]): S[] {
    return instances.reduce<S[]>((result, instance) => {
      const serializer = this.resolveFromInstance(instance) as Serializer<R, S>|null;

      if (serializer && !this.isExcluded(instance)) {
        result.push(serializer.serialize(instance));
      }

      return result;
    }, []);
  }

  deserializeList<R extends Renderable, S extends Serialized>(serialized: S[]): RenderableConstructorArg<R>[] {
    return serialized.reduce<RenderableConstructorArg<R>[]>((result, instance) => {
      const serializer = this.resolveFromSerialized(instance) as Serializer<R, S>|null;

      if (serializer) {
        result.push(serializer.deserialize(instance));
      }

      return result;
    }, []);
  }

  isExcluded<R extends Renderable & Constructable<any>>(instance: R): boolean {
    const serializer = this.resolveFromInstance(instance) as Serializer<R, any>|null;

    if (serializer && serializer.exclude) {
      return serializer.exclude(instance);
    }

    return false;
  }

  /**
   * Resolves a token with this containers injector.
   * @template T The return type.
   * @param {*} token 
   * @returns {(T|null)} 
   */
  resolve<T>(token: any): T|null {
    return this._injector.get(token, null);
  }
}