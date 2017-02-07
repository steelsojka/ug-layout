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

export class ForwardRef {
  constructor(private fn: Function) {}

  get ref(): any {
    return this.fn();
  }
}

export function forwardRef(fn: Function) {
  return new ForwardRef(fn);
}

export class Injector {
  private _providers: Provider[] = [];
  private _cache: Map<any, any> = new Map();
  
  constructor(
    providers: Array<Provider|Function> = [],
    private _parent: Injector|null = null
  ) {
    this._providers = providers.map(provider => {
      if (typeof provider === 'function') {
        return { provide: provider, useClass: provider };
      }

      return provider;
    });

    this._providers.push({ provide: Injector, useValue: this });
  }

  get parent(): Injector|null {
    return this._parent;
  }

  get(token: any, defaultValue?: any, metadata: InjectionMetadata = {}): any {
    let resource;
    let { optional = false, lazy = false } = metadata;

    if (lazy) {
      return () => this.get(token, defaultValue, { ...metadata, lazy: false });
    }
    
    if (this._cache.has(token)) {
      return this._cache.get(token);
    }

    for (const provider of this._providers) {
      let provideRef = provider.provide;
      
      if (provideRef instanceof ForwardRef) {
        provideRef = provideRef.ref;
      }
      
      if (provideRef === token) {
        resource = this.resolve(provider, metadata);

        this._cache.set(token, resource);
      }
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
  
  spawn(providers: Array<Provider|Function> = []): Injector {
    return new Injector(providers, this);    
  }

  private resolve(provider: Provider, metadata: InjectionMetadata = {}): any {
    if (this._isClassProvider(provider)) {
      const injections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, provider.useClass, (<any>undefined)) || [];
      const resolved = this.getDependencies(injections);
      const ref = this.resolveRef(provider.useClass);

      return this.instantiate(ref, ...resolved);
    } else if (this._isFactoryProvider(provider)) {
      const resolved = this.getDependencies(provider.deps || []);
      const ref = this.resolveRef(provider.useFactory);

      return ref(...resolved);
    } else if (this._isValueProvider(provider)) {
      return this.resolveRef(provider.useValue);
    } else if (this._isExistingProvider(provider)) {
      return this.get(this.resolveRef(provider.useExisting));
    }

    throw new Error('Injector -> could not resolve provider ${provider.provide}');
  }
      
  private resolveRef(value: any): any {
    if (value instanceof ForwardRef) {
      return value.ref;
    }

    return value;
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
      case 13: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12]);
      case 14: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13]);
      case 15: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14]);
      case 16: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15]);
      case 17: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15], d[16]);
      case 18: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15], d[16], d[17]);
      case 19: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15], d[16], d[17], d[18]);
      case 20: return new Ref(d[0], d[1], d[2], d[3], d[4], d[5], d[6], d[7], d[8], d[9], d[10], d[11], d[12], d[13], d[14], d[15], d[16], d[17], d[18], d[19]);
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

  static fromInjectable(injectable: Type<any>, providers: ProviderArg[] = [], parent?: Injector): Injector {
    const metadata = Reflect.getOwnMetadata(INJECTABLE_META_KEY, injectable);

    if (metadata) {
      providers = [...providers, ...(<InjectableConfig>metadata).providers];
    }

    return new Injector(providers, parent);
  }
}