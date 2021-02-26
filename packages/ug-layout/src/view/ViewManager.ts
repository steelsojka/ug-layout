import { CompleteOn } from 'rx-decorators/completeOn';
import { Subject, Observable, empty, merge, MonoTypeOperatorFunction } from 'rxjs';
import { map, filter } from 'rxjs/operators';

import { Inject } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';
import { ContextType } from '../common';
import {
  VIEW_CONFIG_KEY,
  ViewConfig,
  ViewComponentConfig,
  ResolverStrategy,
  ViewQueryArgs,
  CacheStrategy
} from './common';
import { propEq } from '../utils';

export interface ViewManagerEvent<T> {
  type: 'resolve' | 'create' | 'register' | 'unregister' | 'refAdd' | 'refRemove' | 'query';
  ref?: string|null;
  token: any;
  container: ViewContainer<T>;
  initial?: boolean;
}

export interface ViewManagerQueryEvent<T> extends ViewManagerEvent<T> {
  type: 'query',
  initial: boolean;
}

export interface RefChangeEvent<T> extends ViewManagerEvent<T> {
  type: 'refAdd' | 'refRemove';
  ref: string;
}

export interface ViewResolutionOptions {
  emit?: boolean;
}

export class ViewManager {
  @Inject(ViewFactory) private _viewFactory: ViewFactory;

  private _views: Map<any, { [key: string]: ViewContainer<any> }> = new Map();
  private _refs: Map<string, ViewContainer<any>> = new Map();

  @CompleteOn('destroy')
  private _destroyed: Subject<void> = new Subject<void>();

  @CompleteOn('destroy')
  private _events: Subject<ViewManagerEvent<any>> = new Subject();

  events = this._events.asObservable();
  resolved = this.events.pipe(filter(propEq('type', 'resolve')));
  created = this.events.pipe(filter(propEq('type', 'create')));
  registered = this.events.pipe(filter(propEq('type', 'register')));
  unregistered = this.events.pipe(filter(propEq('type', 'unregister')));
  refChanges = this.events.pipe(filter(event => event.type === 'refAdd' || event.type === 'refRemove')) as Observable<RefChangeEvent<any>>;
  destroyed: Observable<void> = this._destroyed.asObservable();

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

    return this.createWith<T>(config, factory);
  }

  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    return this.createWith(args.config, (): ViewContainer<T> => {
      return this._viewFactory.create<T>(args);
    });
  }

  createWith<T>(config: ViewConfig, factory: (viewFactory: ViewFactory) => ViewContainer<T>): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(config);

    this._assertAndReadComponent(token);

    const container = factory(this._viewFactory);

    this._events.next({
      type: 'create',
      container,
      token,
      ref: config.ref
    })

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
      this._events.next({
        ref, container, token,
        type: 'refAdd',
      });
    }

    this._events.next({
      type: 'register',
      container, token, ref
    });
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
      this._events.next({
        ref, container, token,
        type: 'refRemove'
      });
    }

    this._events.next({ type: 'unregister', container, token, ref });
  }

  /**
   * Notifies when the a view is registered matching the given query.
   * @template T
   * @param {{ token?: any, ref?: string }} [query={}]
   * @returns {Observable<ViewContainer<T>>}
   */
  subscribeToQuery<T>(query: ViewQueryArgs = {}): Observable<ViewManagerEvent<T>> {
    const { ref, token, id } = query;

    if (ref) {
      return this.queryRef(ref, query);
    } else if (token) {
      return this.queryToken(token, id, query);
    }

    return empty();
  }

  queryToken<T>(token: any, id?: number, options: ViewQueryArgs = {}): Observable<ViewManagerEvent<T>> {
    const { immediate = false } = options;

    return new Observable<ViewManagerQueryEvent<T>>(observer => {
      for (const container of this.query<T>({ token, id })) {
        observer.next({
          type: 'query',
          token,
          container,
          initial: true
        });
      }

      if (immediate) {
        observer.complete();

        return;
      }

      return merge(
        this.created.pipe(map(event => ({ ...event, initial: true }))),
        this.unregistered.pipe(map(event => ({ ...event, initial: false })))
      )
        .pipe(
          filter(propEq('token', token)),
          filter(e => id ? id === e.container.id : true))
        .subscribe(observer);
    });
  }

  queryRef<T>(ref: string, options: ViewQueryArgs = {}): Observable<ViewManagerEvent<T>> {
    const { immediate = false } = options;

    return new Observable<ViewManagerQueryEvent<T>>(observer => {
      const result = this.query<T>({ ref });

      if (result.length) {
        observer.next({
          type: 'query',
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

      return this.refChanges.pipe(
        map(event => ({ ...event, initial: event.type === 'refAdd' })),
        filter(propEq('ref', ref))
      )
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
      this._events.next({
        type: 'resolve',
        ref: config.ref,
        container: result,
        token: this._viewFactory.getTokenFrom(config)
      });
    }

    return result;
  }

  private _assertAndReadComponent(token: any): ViewComponentConfig {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    if (!metadata) {
      throw new Error(`The given token is not a registered ViewComponent.`);
    }

    return metadata;
  }

  static isResolvedEventType(eventType: ViewManagerEvent<any>['type']): boolean {
    return eventType !== 'unregister' && eventType !== 'refRemove';
  }
}
