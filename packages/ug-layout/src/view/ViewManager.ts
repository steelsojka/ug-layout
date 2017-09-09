import { CompleteOn } from 'rx-decorators/completeOn';

import { Inject, Type } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';
import { Subject, Observable, Observer } from '../events';
import { ContextType } from '../common';
import {
  VIEW_CONFIG_KEY, 
  ViewConfig, 
  ViewComponentConfig, 
  ResolverStrategy,
  ViewQueryArgs,
  ViewQueryResolveType,
  CacheStrategy
} from './common';
import { propEq } from '../utils';

export interface ViewManagerEvent<T> {
  ref?: string|null;
  token: any;
  container: ViewContainer<T>;
}

export interface ViewManagerQueryEvent<T> extends ViewManagerEvent<T> {
  initial: boolean;
}

export interface RefChangeEvent<T> extends ViewManagerEvent<T> {
  ref: string;
  type: 'add'|'remove';
}

export interface ViewResolutionOptions {
  emit?: boolean;
}

export class ViewManager {
  @Inject(ViewFactory) private _viewFactory: ViewFactory;

  private _views: Map<any, { [key: string]: ViewContainer<any> }> = new Map();
  private _refs: Map<string, ViewContainer<any>> = new Map();

  @CompleteOn('destroy') 
  private _resolved: Subject<ViewManagerEvent<any>> = new Subject();

  @CompleteOn('destroy') 
  private _created: Subject<ViewManagerEvent<any>> = new Subject();

  @CompleteOn('destroy') 
  private _destroyed: Subject<void> = new Subject<void>();

  @CompleteOn('destroy') 
  private _refChanges: Subject<RefChangeEvent<any>> = new Subject();

  resolved: Observable<ViewManagerEvent<any>> = this._resolved.asObservable();
  created: Observable<ViewManagerEvent<any>> = this._created.asObservable();
  destroyed: Observable<void> = this._destroyed.asObservable();
  refChanges: Observable<RefChangeEvent<any>> = this._refChanges.asObservable();

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
  }

  getRef<T>(ref: string): ViewContainer<T>|null {
    return this._refs.get(ref) || null;
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
      this._refChanges.next({ 
        ref, container, token, 
        type: 'add',
      });
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
      this._refChanges.next({ 
        ref, container, token, 
        type: 'remove'
      });
    }
  }

  /**
   * Notifies when the a view is registered matching the given query.
   * @template T 
   * @param {{ token?: any, ref?: string }} [query={}] 
   * @returns {Observable<ViewContainer<T>>} 
   */
  subscribeToQuery<T>(query: ViewQueryArgs = {}): Observable<ViewManagerQueryEvent<T>> {
    const { ref, token, id } = query;
  
    if (ref) {
      return this.queryRef(ref, query);
    } else if (token) {
      return this.queryToken(token, id, query);
    }

    return Observable.empty();
  }

  queryToken<T>(token: any, id?: number, options: ViewQueryArgs = {}): Observable<ViewManagerQueryEvent<T>> {
    const { immediate = false } = options;

    return Observable.create((observer: Observer<ViewManagerQueryEvent<T>>) => {
      for (const container of this.query<T>({ token, id })) {
        observer.next({
          token,
          container,
          initial: true
        });
      }

      if (immediate) {
        observer.complete();

        return;
      }

      return Observable.merge(
        this.created.map(event => ({ ...event, initial: true })),
        this.resolved.map(event => ({ ...event, initial: false }))
      ) 
        .filter(propEq('token', token))
        .filter(e => id ? id === e.container.id : true)
        .subscribe(observer);
    });
  }

  queryRef<T>(ref: string, options: ViewQueryArgs = {}): Observable<ViewManagerQueryEvent<T>> {
    const { immediate = false } = options;

    return Observable.create((observer: Observer<ViewManagerQueryEvent<T>>) => {
      const result = this.query<T>({ ref });
      
      if (result.length) {
        observer.next({
          ref,
          token: this._viewFactory.getTokenFrom(result[0].config),
          initial: true,
          container: result[0]  
        });
      }

      if (immediate) {
        observer.complete();

        return;
      }

      return Observable.merge(
        this.refChanges
          .filter(propEq('type', 'add'))
          .map(event => ({ ...event, initial: true })),
        this.resolved
          .map(event => ({ ...event, initial: false }))
      )
        .filter(propEq('ref', ref))
        .subscribe(observer);
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

  /**
   * Purges any cached views that should be destroyed with the following context.
   * @param {ContextType} context 
   */
  purgeCached(context: ContextType): void {
    for (const container of this.entries()) {
      if (context === ContextType.LOAD) {
        if (container.caching !== CacheStrategy.PERSISTENT) {
          container.destroy();
        }
      }  
    }
  }

  * entries(): IterableIterator<ViewContainer<any>> {
    for (const map of this._views.values()) {
      for (const key of Object.keys(map)) {
        yield map[key];
      }
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

  private _resolveViewQueryStream<T>(types: ViewQueryResolveType[], initStream: Observable<ViewManagerEvent<T>>): Observable<ViewManagerEvent<T>> {
    const streams: Observable<ViewManagerEvent<T>>[] = [];

    if (types.indexOf(ViewQueryResolveType.INIT) !== -1) {
      streams.push(initStream);
    }

    if (types.indexOf(ViewQueryResolveType.RESOLVE) !== -1) {
      streams.push(this.resolved);
    }

    return streams.length > 0 ? Observable.merge(...streams) : Observable.empty();
  }

  private _assertAndReadComponent(token: any): ViewComponentConfig {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    if (!metadata) {
      throw new Error(`The given token is not a registered ViewComponent.`);
    }

    return metadata;
  }
}