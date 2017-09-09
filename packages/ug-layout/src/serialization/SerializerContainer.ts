import { Injector, Type } from '../di';
import { Renderable, RenderableConfig } from '../dom';
import { Serializer, Serialized, SERIALIZER_CONFIG } from './Serializer';
import { isFunction, isString, ReversibleMap } from '../utils';
import { ConfiguredSerializer } from './ConfiguredSerializer';
import { RenderableConstructorArg } from '../common';

export interface Constructable<T> {
  constructor: Function;
}

export type BaseSerializer = Serializer<Renderable, Serialized>;
export type BaseSerializerArg = BaseSerializer | typeof Serializer | ConfiguredSerializer<typeof Serializer, any>;

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
  protected _serializers: Map<Type<any>, BaseSerializerArg> = new Map();
  protected _classMap: ReversibleMap<Type<any>, string> = new ReversibleMap<Type<any>, string>();
  protected _instanceCache: WeakMap<any, Serializer<any, any>> = new WeakMap();

  /**
   * Creates an instance of SerializerContainer.
   * @param {SerializerContainerConfig} [config={}] 
   */
  constructor(config: SerializerContainerConfig = {}) {
    this._injector = new Injector([ { provide: SerializerContainer, useValue: this } ], config.injector || null);
  }

  /**
   * Registers a serializer with the container.
   * @param {Type<any>} _Class 
   * @param {(BaseSerializer|Type<BaseSerializer>)} serializer 
   * @param {{ skipRegister?: boolean }} [options={}] 
   */
  registerSerializer(_Class: Type<any>, serializer: BaseSerializerArg, options: { skipRegister?: boolean } = {}): void {
    const { skipRegister = false } = options;

    this._serializers.set(_Class, serializer);

    this._injector.registerProvider({
      provide: serializer, 
      useFactory: () => this.constructSerializer(serializer)
    });

    if (!skipRegister && isFunction(serializer['register'])) {
      serializer['register'](this);
    }
  }

  constructSerializer(serializer: BaseSerializerArg): Serializer<any, any> {
    let token: typeof Serializer | BaseSerializer;   
    let config: any = null;

    if (serializer instanceof ConfiguredSerializer) {
      token = ConfiguredSerializer.resolveItem<typeof Serializer>(serializer);
      config = ConfiguredSerializer.resolveConfig(serializer);
    } else {
      token = serializer;
    }

    if (config != null) {
      return this._injector.resolveAndCreateChild([
        { provide: SERIALIZER_CONFIG, useValue: config }
      ])
        .resolveAndInstantiate(token);
    }

    if (isFunction(serializer)) {
      return this._injector.resolveAndInstantiate(token);
    }

    return serializer as Serializer<any, any>;
  }

  /**
   * Registers a class that can be identified by a string representation.
   * @param {string} name 
   * @param {Type<any>} _Class 
   */
  registerClass(name: string, _Class: Type<any>): void {
    this._classMap.set(_Class, name);
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
    return this._classMap.has(_Class) ? this._classMap.get(_Class) as string : null;
  }

  /**
   * Resolves a serializer from a serialized node.
   * @param {Serialized} node 
   * @returns {(BaseSerializer|null)} 
   */
  resolveFromSerialized(node: Serialized): Serializer<any, any>|null {
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
  resolveFromClass(_Class: Type<any>): Serializer<any, any>|null {
    if (this._serializers.has(_Class)) {
      return this.resolve<Serializer<any, any>>(this._serializers.get(_Class));
    }

    return null;
  }

  /**
   * Resolves a serializer from an instance of a registered class.
   * @param {(Renderable & Constructable<any>)} instance 
   * @returns {(BaseSerializer|null)} 
   */
  resolveFromInstance(instance: Renderable & Constructable<any>): BaseSerializer|null {
    if (this._instanceCache.has(instance)) {
      return this._instanceCache.get(instance) as BaseSerializer;
    }

    const serializer = instance.getSerializer();

    if (serializer) {
      this._instanceCache.set(instance, this.constructSerializer(serializer));

      return this._instanceCache.get(instance) as BaseSerializer;
    }

    return this.resolveFromClass(instance.constructor as Type<any>);
  }

  /**
   * Resolves a string to a registered class.
   * @param {string} name 
   * @returns {(Type<any>|null)} 
   */
  resolveClass<T>(name: string): Type<T>|null {
    return this._classMap.has(name) ? this._classMap.get(name) as Type<T> : null;
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

    return this._serialize(serializer, instance);
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


    return this._deserialize(serializer, serialized);
  }

  serializeList<R extends Renderable & Constructable<any>, S extends Serialized>(instances: R[]): S[] {
    return instances.reduce<S[]>((result, instance) => {
      const serializer = this.resolveFromInstance(instance) as Serializer<R, S>|null;

      if (serializer && !this.isExcluded(instance)) {
        result.push(this._serialize(serializer, instance));
      }

      return result;
    }, []);
  }

  deserializeList<R extends Renderable, S extends Serialized>(serialized: S[]): RenderableConstructorArg<R>[] {
    return serialized.reduce<RenderableConstructorArg<R>[]>((result, instance) => {
      const serializer = this.resolveFromSerialized(instance) as Serializer<R, S>|null;

      if (serializer) {
        result.push(this._deserialize(serializer, instance));
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
  resolve<T>(token: any, _throw: boolean = false): T {
    return _throw ? this._injector.get(token) : this._injector.get(token, null);
  }

  private _deserialize<R extends Renderable, S extends Serialized>(serializer: Serializer<R, S>, serialized: S): RenderableConstructorArg<R> {
    return serializer.postDeserialized(serialized, serializer.deserialize(serialized));
  }

  private _serialize<R extends Renderable & Constructable<any>, S extends Serialized>(serializer: Serializer<R, S>, instance: R): S {
    return serializer.postSerialized(instance, serializer.serialize(instance));
  }
}