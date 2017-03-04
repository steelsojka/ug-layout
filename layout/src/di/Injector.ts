import { 
  Type,
  Provider, 
  ProviderArg,
  INJECT_PARAM_KEY, 
  InjectionMetadata,
  InjectableConfig,
  INJECTABLE_META_KEY,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  ExistingProvider
} from './common';

/**
 * An instance of a forward ref function.
 * @export
 * @class ForwardRef
 * @example
 * const test = new ForwardRef(() => 'test');
 * 
 * test.ref; // => 'test'
 */
export class ForwardRef {
  constructor(private fn: Function) {}

  /**
   * The reference invoked reference function result.
   * @readonly
   * @type {*}
   */
  get ref(): any {
    return this.fn();
  }

  /**
   * Resolves a potential forward reference.
   * @static
   * @param {*} val 
   * @returns {*} 
   */
  static resolve(val: any): any {
    if (val instanceof ForwardRef) {
      return val.ref;
    }

    return val;
  }
}

/**
 * A factory that creates a ForwardRef.
 * @export
 * @param {Function} fn 
 * @returns {ForwardRef}
 * @example
 * const test = forwardRef(() => 'test');
 * 
 * test.ref; // => 'test'
 */
export function forwardRef(fn: Function): ForwardRef {
  return new ForwardRef(fn);
}

/**
 * A dependency injector for resolving dependencies. Injectors are hierarchicle.
 * @export
 * @class Injector
 * @example
 * const injector = new Injector([
 *   { provide: 'test', useValue: 'blorg' },
 *   { provide: 'factory', useFactory: () => 'BOOM' },
 *   { provide: 'myClass', useClass: MyClass },
 *   MyClass
 * ]);
 * 
 * injector.get('test'); // => 'blorg';
 * injector.get('factory'); // => 'BOOM';
 * injector.get('myClass'); // => instanceof MyClass;
 * injector.get(MyClass); // => instanceof MyClass;
 */
export class Injector {
  private _providers: Map<any, Provider> = new Map();
  private _cache: Map<any, any> = new Map();
  
  /**
   * Creates an instance of Injector.
   * @param {ProviderArg[]} [providers=[]] List of providers for this injector.
   * @param {(Injector|null)} [_parent=null] A parent injector.
   */
  constructor(
    providers: ProviderArg[] = [],
    private _parent: Injector|null = null
  ) {
    this.registerProvider({ provide: Injector, useValue: this });

    providers.forEach(p => this.registerProvider(p));
  }

  /**
   * The parent injector if it is set.
   * @readonly
   * @type {(Injector|null)}
   */
  get parent(): Injector|null {
    return this._parent;
  }

  /**
   * Registers a provider with the injector.
   * @param {ProviderArg} provider 
   */
  registerProvider(provider: ProviderArg): void {
    const _provider = this._normalizeProvider(provider);

    this._providers.set(_provider.provide, _provider);
  }

  /**
   * Gets a dependecy from the provided token.
   * @param {*} token 
   * @param {*} [defaultValue] 
   * @param {InjectionMetadata} [metadata={}] 
   * @returns {*} 
   */
  get(token: any, defaultValue?: any, metadata: InjectionMetadata = {}): any {
    let resource;
    let { optional = false, lazy = false } = metadata;

    if (lazy) {
      return () => this.get(token, defaultValue, { ...metadata, lazy: false });
    }
    
    if (this._cache.has(token)) {
      return this._cache.get(token);
    }

    if (this._providers.has(token)) {
      const provider = this._providers.get(token);
      resource = this._resolve(provider as Provider, metadata);

      this._cache.set(token, resource);
    }

    if (resource === undefined && !metadata.self && this._parent) {
      resource = this._parent.get(token, defaultValue, metadata);
    }
    
    if (resource === undefined) {
      if (defaultValue !== undefined) {
        resource = defaultValue;
      } else if (optional) {
        resource = null;
      } else {
        throw new Error(`Injector -> no token exists for ${token}`);
      }
    }

    return resource;
  }
  
  /**
   * Creates a new injector with the given providers and sets
   * this injector as it's parent.
   * @param {ProviderArg[]} [providers=[]] 
   * @returns {Injector} 
   */
  resolveAndCreateChild(providers: ProviderArg[] = []): Injector {
    return new Injector(providers, this);    
  }

  /**
   * Programmatically set the parent injector.
   * @param {Injector} parent 
   */
  setParent(parent: Injector): void {
    this._parent = parent;
  }

  /**
   * Resolves the given provider with this injector.
   * @template T The return type.
   * @param {*} provider 
   * @returns {T} 
   */
  resolveAndInstantiate<T>(provider: any): T {
    return this._resolve(provider);
  }

  private _resolve(_provider: ProviderArg, metadata: InjectionMetadata = {}): any {
    const provider = this._normalizeProvider(_provider);
    
    if (this._isClassProvider(provider)) {
      const injections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, provider.useClass, (<any>undefined)) || [];
      const resolved = this.getDependencies(injections);
      const ref = ForwardRef.resolve(provider.useClass);

      return this.instantiate(ref, ...resolved);
    } else if (this._isFactoryProvider(provider)) {
      const resolved = this.getDependencies((provider.deps || []).map(token => ({ token })));
      const ref = ForwardRef.resolve(provider.useFactory);

      return ref(...resolved);
    } else if (this._isValueProvider(provider)) {
      return ForwardRef.resolve(provider.useValue);
    } else if (this._isExistingProvider(provider)) {
      return this.get(ForwardRef.resolve(provider.useExisting));
    }

    throw new Error('Injector -> could not resolve provider ${provider.provide}');
  }
      
  private getDependencies(metadata: any[]): any[] {
    return metadata.map(meta => this.get(meta.token, undefined, meta));
  }

  private instantiate(Ref: any, ...d: any[]): any {
    switch (d.length) {
      case 0: return new Ref();
      case 1: return new Ref(d[0]);
      case 2: return new Ref(d[0], d[1]);
      case 3: return new Ref(d[0], d[1], d[2]);
      case 4: return new Ref(d[0], d[1], d[2], d[3]);
      case 5: return new Ref(d[0], d[1], d[2], d[3], d[4]);
      case 6: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5]);
      case 7: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6]);
      case 8: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7]);
      case 9: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8]);
      case 10: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9]);
      case 11: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10]);
      case 12: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11]);
      default: 
        return new Ref(...d);
    }
  }

  private _isClassProvider(provider: Provider): provider is ClassProvider {
    return provider.hasOwnProperty('useClass');
  }

  private _isFactoryProvider(provider: Provider): provider is FactoryProvider {
    return provider.hasOwnProperty('useFactory');
  }

  private _isValueProvider(provider: Provider): provider is ValueProvider {
    return provider.hasOwnProperty('useValue');
  }

  private _isExistingProvider(provider: Provider): provider is ExistingProvider {
    return provider.hasOwnProperty('useExisting');
  }

  private _normalizeProvider(_provider: ProviderArg): Provider {
    if (typeof _provider === 'function') {
      return { provide: _provider, useClass: _provider };
    } 

    return _provider;
  }

  /**
   * Creates a new injector from an annotated injectable Class.
   * @static
   * @param {Type<any>} injectable 
   * @param {ProviderArg[]} [providers=[]] 
   * @param {Injector} [parent] 
   * @returns {Injector} 
   */
  static fromInjectable(injectable: Type<any>, providers: ProviderArg[] = [], parent?: Injector): Injector {
    return new Injector([ ...Injector.resolveInjectables(injectable), ...providers ], parent);
  }

  static resolveInjectables(injectable: Type<any>): ProviderArg[] {
    const metadata = Reflect.getOwnMetadata(INJECTABLE_META_KEY, injectable);

    if (metadata) {
      return (<InjectableConfig>metadata).providers;
    }
    
    return [];
  }
}