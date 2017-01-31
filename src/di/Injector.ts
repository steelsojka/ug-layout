import { Provider, INJECT_PARAM_KEY } from './common';

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
  }

  get parent(): Injector|null {
    return this._parent;
  }

  get(token: any, defaultValue?: any, injector: Injector = this): any {
    let resource;
    
    if (this._cache.has(token)) {
      return this._cache.get(token);
    }

    for (const provider of this._providers) {
      let provideRef = provider.provide;
      
      if (provideRef instanceof ForwardRef) {
        provideRef = provideRef.ref;
      }
      
      if (provideRef === token) {
        resource = this.resolve(provider, injector);

        this._cache.set(token, resource);
      }
    }

    if (!resource && this._parent) {
      resource = this._parent.get(token, defaultValue, injector);
    }
    
    if (!resource) {
      if (defaultValue !== undefined) {
        resource = defaultValue;
      } else {
        throw new Error(`Injector -> no token exists for ${token}`);
      }
    }

    return resource;
  }
  
  spawn(providers: Array<Provider|Function> = []): Injector {
    return new Injector(providers, this);    
  }

  private resolve(provider: Provider, injector: Injector = this): any {
    if (provider.useClass) {
      const injections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, provider.useClass, 'constructor') || [];
      const resolved = this.getDependencies(injections, injector);
      const ref = this.resolveRef(provider.useClass);

      return new ref(...resolved);
    } else if (provider.useFactory) {
      const resolved = this.getDependencies(provider.deps || [], injector);
      const ref = this.resolveRef(provider.useFactory);

      return ref(...resolved);
    } else if (provider.useValue) {
      return this.resolveRef(provider.useValue);
    }

    throw new Error('Injector -> could not resolve provider ${provider.provide}');
  }
      
  private resolveRef(value: any): any {
    if (value instanceof ForwardRef) {
      return value.ref;
    }

    return value;
  }
      
  private getDependencies(tokens: any[], injector: Injector = this): any[] {
    return tokens.map(token => injector.get(token));
  }
}