import { Injector, Type } from '../di';
import { Renderable } from '../dom';
import { Serializer, Serialized } from './common';
import { isFunction, isString } from '../utils';
import { RenderableArg } from '../common';

interface Constructable<T> {
  constructor: Function;
}

type BaseSerializer = Serializer<Renderable, Serialized>;

export interface SerializerContainerConfig {
  injector?: Injector;
}

export class SerializerContainer {
  protected _injector;
  protected _serializers: Map<Type<any>, BaseSerializer|Type<BaseSerializer>> = new Map();
  protected _classToStringMap: Map<Type<any>, string> = new Map();

  constructor(config: SerializerContainerConfig = {}) {
    this._injector = new Injector([], config.injector || null);
    this._injector.registerProvider({ provide: SerializerContainer, useValue: this });
  }

  registerSerializer(_Class: Type<any>, serializer: BaseSerializer|Type<BaseSerializer>, options: { skipRegister?: boolean } = {}): void {
    const { skipRegister = false } = options;
    
    this._serializers.set(_Class, serializer);
    this._injector.registerProvider(isFunction(serializer) ? serializer : { provide: serializer, useValue: serializer });

    if (!skipRegister && isFunction(serializer['register'])) {
      serializer['register'](this);
    }
  }

  registerClass(name: string, _Class: Type<any>): void {
    this._classToStringMap.set(_Class, name);
    this._injector.registerProvider({ provide: name, useValue: _Class });
  }
  
  registerClasses(classes: { [key:string]: Type<any> } = {}): void {
    for (const key of Object.keys(classes)) {
      this.registerClass(key, classes[key]);
    }
  }

  resolveClassString(_Class: Type<any>): string|null {
    return this._classToStringMap.get(_Class) || null;
  }

  resolveFromSerialized(node: Serialized): BaseSerializer|null {
    const _Class = this.resolveClass(node.name);

    if (_Class) {
      if (this._serializers.has(_Class)) {
        return this._injector.get(this._serializers.get(_Class));
      }
    }

    return null;
  }
  
  resolveFromClass(_Class: Type<any>): BaseSerializer|null {
    if (this._serializers.has(_Class)) {
      return this.resolve<BaseSerializer>(this._serializers.get(_Class));
    }

    return null;
  }

  resolveFromInstance(instance: Renderable & Constructable<any>): BaseSerializer|null {
    return this.resolveFromClass(instance.constructor as Type<any>);
  }

  resolveClass(name: string): Type<any>|null {
    return this.resolve<Type<any>>(name);
  }

  serialize<R extends Renderable & Constructable<any>, S extends Serialized>(instance: R): S {
    const serializer = this.resolveFromInstance(instance) as Serializer<R, S>|null;

    if (!serializer) {
      throw new Error(`Serializer for class '${instance.constructor.name}' is not registered.`);
    }

    return serializer.serialize(instance);
  }
  
  deserialize<R extends Renderable, S extends Serialized>(serialized: S): RenderableArg<R> {
    const serializer = this.resolveFromSerialized(serialized) as Serializer<R, S>|null;

    if (!serializer) {
      throw new Error(`Serializer for node '${serialized.name}' is not registered.`);
    }

    return serializer.deserialize(serialized);
  }

  resolve<T>(token: any): T|null {
    return this._injector.get(token, null);
  }
}