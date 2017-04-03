import { Inject, Type } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';
import { Subject, Observable, Observer } from '../events';
import {
  VIEW_CONFIG_KEY, 
  ViewConfig, 
  ViewComponentConfig, 
  ResolverStrategy,
  ViewQueryArgs
} from './common';
import { propEq } from '../utils';

export interface ViewManagerEvent<T> {
  ref?: string|null;
  token: any;
  container: ViewContainer<T>;
}

export interface RefChangeEvent<T> {
  ref: string;
  container: ViewContainer<T>;
  token: any;
  type: 'add'|'remove';
}

export interface ViewResolutionOptions {
  emit?: boolean;
}

export class ViewManager {
  private _views: Map<any, { [key: string]: ViewContainer<any> }> = new Map();
  private _refs: Map<string, ViewContainer<any>> = new Map();
  private _resolved: Subject<ViewManagerEvent<any>> = new Subject();
  private _created: Subject<ViewManagerEvent<any>> = new Subject();
  private _destroyed: Subject<void> = new Subject<void>();
  private _refChanges: Subject<RefChangeEvent<any>> = new Subject();
  private _viewInit: Subject<ViewManagerEvent<any>> = new Subject();

  resolved: Observable<ViewManagerEvent<any>> = this._resolved.asObservable();
  created: Observable<ViewManagerEvent<any>> = this._created.asObservable();
  destroyed: Observable<void> = this._destroyed.asObservable();
  refChanges: Observable<RefChangeEvent<any>> = this._refChanges.asObservable();
  viewInit: Observable<ViewManagerEvent<any>> = this._viewInit.asObservable();
  
  constructor(
    @Inject(ViewFactory) private _viewFactory: ViewFactory
  ) {}

  has(token: any, id?: number): boolean {
    const map = this.getAll(token);
    
    if (!map) {
      return false;
    }

    if (id != null) {
      return map.hasOwnProperty(id);
    }

    return true;
  }

  get<T>(token: any, id: number): ViewContainer<T>|null {
    const map = this.getAll(token);

    if (!map) {
      return null;
    }

    return map.hasOwnProperty(id) ? map[id] : null;
  }

  getAll(token: any): ({ [key:number]: ViewContainer<any> })|null {
    return this._views.get(token) || null;
  }

  destroy() {
    for (const views of this._views.values()) {
      for (const key of Object.keys(views)) {
        const view = views[key] as ViewContainer<any>|null;

        if (view) {
          view.destroy();  
        }
      }
    }      

    this._destroyed.next();
    this._destroyed.complete();
    this._created.complete();
    this._resolved.complete();
    this._refChanges.complete();
    this._viewInit.complete();
  }

  getRef<T>(ref: string): ViewContainer<T>|null {
    return this._refs.get(ref) || null;
  }

  initView<T>(args: ViewFactoryArgs, options: ViewResolutionOptions = {}): ViewContainer<T> {
    const container = this.resolveOrCreate<T>(args, options);

    this._viewInit.next({
      container,
      ref: args.config.ref,
      token: this._viewFactory.getTokenFrom(args.config)
    });

    return container;
  }

  resolve<T>(config: ViewConfig, options: ViewResolutionOptions = {}): ViewContainer<T>|null {
    const token = this._viewFactory.getTokenFrom(config);
    const metadata = this._assertAndReadComponent(token);

    return this._resolve<T>(config, metadata, options);
  }
  
  resolveOrCreate<T>(args: ViewFactoryArgs, options: ViewResolutionOptions = {}): ViewContainer<T> {
    return this.resolveOrCreateWith<T>(args.config, (): ViewContainer<T> => {
      return this._viewFactory.create<T>(args);
    }, options);
  }
  
  resolveOrCreateWith<T>(config: ViewConfig, factory: (viewFactory: ViewFactory) => ViewContainer<T>, options: ViewResolutionOptions = {}): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(config);
    const metadata = this._assertAndReadComponent(token);

    const container = this._resolve<T>(config, metadata, options);

    if (container) {
      return container;
    }

    return this.createWith<T>(config, factory, options);
  }

  create<T>(args: ViewFactoryArgs, options: ViewResolutionOptions = {}): ViewContainer<T> {
    return this.createWith(args.config, (): ViewContainer<T> => {
      return this._viewFactory.create<T>(args);
    }, options);
  }
  
  createWith<T>(config: ViewConfig, factory: (viewFactory: ViewFactory) => ViewContainer<T>, options: ViewResolutionOptions = {}): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(config);
    
    this._assertAndReadComponent(token);
    
    const container = factory(this._viewFactory);

    this._created.next({
      container,
      token,
      ref: config.ref
    });
    
    this.register(token, container, { ref: config.ref });
    
    return container;
  }

  register(token: any, container: ViewContainer<any>, options: { ref?: string|null } = {}): void {
    const { ref } = options;
    
    if (!this._views.has(token)) {
      this._views.set(token, {});
    }

    const map = this._views.get(token) as { [key:number]: ViewContainer<any> };

    if (map.hasOwnProperty(container.id)) {
      throw new Error(`An view instance entry already exists for ${token} ${container.id}`);
    }

    map[container.id] = container;

    this._views.set(token, map);

    container.destroyed.subscribe(() => this.unregister(token, container, { ref }));
    
    if (ref) {
      if (this._refs.has(ref)) {
        throw new Error(`Ref '${ref}' already exists.`);
      }
      
      this._refs.set(ref, container);
      this._refChanges.next({ ref, container, token, type: 'add' });
    }
  }
  
  unregister(token: any, container: ViewContainer<any>, options: { ref?: string|null } = {}): void {
    const { ref } = options;
    const map = this._views.get(token) as { [key:number]: ViewContainer<any> };

    if (!map) {
      throw new Error(`No entries exist for token ${token}`);
    }

    if (!map.hasOwnProperty(container.id)) {
      throw new Error(`An view instance entry already exists for ${token} ${container.id}`);
    }

    delete map[container.id];

    if (Object.keys(map).length === 0) {
      this._views.delete(token);
    }

    if (ref && this._refs.has(ref)) {
      this._refs.delete(ref);
      this._refChanges.next({ ref, container, token, type: 'remove' });
    }
  }

  private _resolve<T>(config: ViewConfig, metadata: ViewComponentConfig, options: ViewResolutionOptions): ViewContainer<T>|null {
    const resolution = this._viewFactory.resolveConfigProperty(config, 'resolution');
    let result: ViewContainer<T>|null = null;
      
    // REF
    if (resolution === ResolverStrategy.REF) {
      if (config.ref && this._refs.has(config.ref)) {
        result = this.getRef(config.ref) as ViewContainer<T>;
      }
    } else {
      // SINGLETON
      const token = this._viewFactory.getTokenFrom(config);
      const views = this.getAll(token);

      if (views) {
        const keys = Object.keys(views);

        if (keys.length) {
          result = views[keys[0]];
        }
      }
    }

    if (result && options.emit !== false) {
      this._resolved.next({
        ref: config.ref,
        container: result,
        token: this._viewFactory.getTokenFrom(config)
      });
    }
    
    return result;
  }

  /**
   * Notifies when the a view is registered matching the given query.
   * @template T 
   * @param {{ token?: any, ref?: string }} [query={}] 
   * @returns {Observable<ViewContainer<T>>} 
   */
  subscribeToQuery<T>(query: ViewQueryArgs = {}): Observable<ViewContainer<T>> {
    const { ref, token, id } = query;
  
    if (ref) {
      return this.queryRef(ref);
    } else if (token) {
      return this.queryToken(token, id);
    }

    return Observable.empty();
  }

  queryToken<T>(token: any, id?: number): Observable<ViewContainer<T>> {
    return Observable.create((observer: Observer<ViewContainer<T>>) => {
      for (const container of this.query<T>({ token, id })) {
        observer.next(container);
      }

      const sub = this.viewInit
        .filter(propEq('token', token))
        .filter(e => id ? id === e.container.id : true)
        .map(e => e.container)
        .subscribe(observer);

      return () => sub.unsubscribe();
    });
  }

  queryRef<T>(ref: string): Observable<ViewContainer<T>> {
    return Observable.create((observer: Observer<ViewContainer<T>>) => {
      const result = this.query<T>({ ref });
      
      if (result.length) {
        observer.next(result[0]);
      }

      const sub = this.refChanges
        .filter(propEq('type', 'add'))
        .filter(propEq('ref', ref))
        .map(e => e.container)
        .subscribe(observer);
        
      return () => sub.unsubscribe();
    });
  }

  query<T>(query: ViewQueryArgs): ViewContainer<T>[] {
    const { ref, id, token } = query;
    
    if (ref && this._refs.has(ref)) {
      return [ this._refs.get(ref) as ViewContainer<T> ];
    } else if (token) {
      if (this.has(token)) {
        const containers = this.getAll(token) as { [key: number]: ViewContainer<T> };

        if (!id) {
          return Object.keys(containers).map(id => containers[id]);
        }
        
        for (const containerId of Object.keys(containers)) {
          if (id && containerId === id.toString()) {
            return [ containers[containerId] ];
          }
        }
      }
    }

    return [];
  }

  private _assertAndReadComponent(token: any): ViewComponentConfig {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    if (!metadata) {
      throw new Error(`The given token is not a registered ViewComponent.`);
    }

    return metadata;
  }
}