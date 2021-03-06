import { Subscription, Observable, Subject, OperatorFunction } from 'rxjs';
import { switchMap, take, filter } from 'rxjs/operators';

import { Inject, Injector } from '../di';
import { ViewManager, ViewManagerEvent } from './ViewManager';
import {
  VIEW_LINKER_METADATA,
  ViewQueryConfig,
  ViewQueryReadType,
  ViewLinkerMetadata,
  ViewInsertConfig,
  ViewResolveConfig,
  ViewQueryReadOptions,
  ViewQueryInitConfig
} from './common';
import { ViewContainer, ViewContainerStatus } from './ViewContainer';
import { get, isFunction, isObject, pluck } from '../utils';
import { LayoutManipulator } from '../layout';
import { getDefaultMetadata } from './decorators';

/**
 * This service wires up a class instance with custom behavior for dealing with communication
 * between multiple views. The instance is usually decorated with decorators that describe the
 * actions needing to be performed. Such actions are resolving a view, inserting {@link Renderable}s into
 * the current layout, or querying for specific views and interacting with them.
 *
 * Due to the async nature of component resolution, it is important to never store the component instances
 * as they could change over the course of the layouts lifecycle. This is why we set up a `ViewResolve` to
 * get the component we want.
 * @export
 * @class ViewLinker
 * @example
 *
 * class MyController {
 *   @ViewResolve({ token: SomeOtherComponent })
 *   getSomeOtherComponent: Observable<SomeOtherComponent>;
 *
 *   @ViewQuery({ token: MyComponent })
 *   onMyViewResolved(component: MyComponent): void {
 *     // MyComponent has stream for selecting something.
 *     component.somethingSelected.subscribe(thing => {
 *       // When MyComponent selected something, set it on SomeOtherComponent.
 *       this.getSomeOtherComponent().subscribe(otherComp => {
 *         otherComp.setSomething(thing);
 *       });
 *     });
 *   }
 * }
 *
 * // Lets assume I have the viewLinker instance from the root layout I'm working with.
 *
 * const myController = new MyController();
 *
 * viewLinker.autowire(myController);
 */
export class ViewLinker {
  @Inject(ViewManager) private _viewManager: ViewManager;
  @Inject(Injector) private _injector: Injector;
  @Inject(LayoutManipulator) private _manipulator: LayoutManipulator;

  /**
   * Wires all types of custom behavior for linker
   * @param {object} instance
   * @returns {Subscription} A subscription for all streams created.
   */
  autowire(instance: object): Subscription {
    const metadata = this.readInstanceMetadata(instance);
    const unlinkSource = new Subject();
    const subscription = new Subscription(() => {
      unlinkSource.next();
      unlinkSource.complete();
    });

    for (const insert of metadata.inserts) {
      this.wireInsert(instance, insert);
    }

    for (const resolve of metadata.resolves) {
      this.wireResolve(instance, resolve);
    }

    for (const query of metadata.queries) {
      subscription.add(this.wireQuery(instance, query));
    }

    for (const unlink of metadata.unlinks) {
      instance[unlink] = unlinkSource.asObservable();
    }

    for (const init of metadata.inits) {
      this._injector.invoke((...args) => instance[init.method](...args), init.injections);
    }

    return subscription;
  }

  /**
   * Wires a query on the instance using the provided config.
   * @param {object} instance
   * @param {ViewQueryConfig} config
   * @returns {Subscription}
   */
  wireQuery(instance: object, config: ViewQueryConfig): Subscription {
    const { read, method } = config;
    const subscription = new Subscription();

    if (!isFunction(instance[method])) {
      throw new Error(`Can not wire method '${method}'. Method does not exist.`);
    }

    subscription.add(
      this._viewManager.subscribeToQuery(config).pipe(
        this.readQuery(read),
        switchMap(arg => new Observable(subscriber => {
          if (!arg) {
            return;
          }

          const _unsubscribed = new Subject<void>();
          const innerSub = new Subscription(() => {
            _unsubscribed.next();
            _unsubscribed.complete();

            if (handlerSub) {
              handlerSub.unsubscribe();
            }
          });

          const handlerSub = instance[method](arg, _unsubscribed.asObservable());

          subscriber.next(arg);

          return innerSub;
        }))
      )
        .subscribe());

    return subscription;
  }

  /**
   * Wires a view insert on the instance using the provided config.
   * @param {object} instance
   * @param {ViewInsertConfig} config
   */
  wireInsert(instance: object, config: ViewInsertConfig): void {
    Object.defineProperty(instance, config.method, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: this._insert.bind(this, instance, config)
    })
  }


  /**
   * Wires a resolve method with the given config.
   * @param {object} instance
   * @param {ViewResolveConfig} config
   */
  wireResolve(instance: object, config: ViewResolveConfig): void {
    Object.defineProperty(instance, config.method, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: this._resolve.bind(this, instance, config)
    })
  }

  /**
   * Reads metadata from a class instance.
   * @param {object} instance
   * @returns {ViewLinkerMetadata}
   */
  readInstanceMetadata(instance: object): ViewLinkerMetadata {
    return this.getMetadata(get(instance, 'constructor.prototype', null));
  }

  /**
   * Reads a query observable from the view manager. A `ViewQuery` decorated method can be given a different
   * argument depending on how you need to interact with the view. If we need the component then the
   * query will wait until the component is in a ready state. If we need the {@link ViewContainer} then it
   * will be given to us regardless of whether the component is ready or not. We can also request the query
   * observable instead if we want some custom resolution logic.
   * @template T
   * @param {Observable<ViewContainer<T>>} query
   * @param {(ViewQueryReadType|ViewQueryReadOptions)} [options]
   * @returns {Observable<any>}
   */
  readQuery<T>(options?: ViewQueryReadType|ViewQueryReadOptions): OperatorFunction<ViewManagerEvent<T>, any> {
    const _options = (isObject(options) ? options : { type: options }) as ViewQueryReadOptions;
    const {
      type = ViewQueryReadType.COMPONENT,
      when = [ ViewContainerStatus.READY ],
      until = [ ViewContainerStatus.FAILED ],
      lazy = true
    } = _options;

    return source => new Observable<any>(observer => {
      if (type === ViewQueryReadType.OBSERVABLE) {
        observer.next(source);
        observer.complete();

        return;
      }

      return source.subscribe({
        next: event => {
          const { container } = event;

          if (type === ViewQueryReadType.EVENT) {
            observer.next(event);
          } else if (!ViewManager.isResolvedEventType(event.type)) {
            observer.next(null);
          } else if (type === ViewQueryReadType.COMPONENT) {
            container.ready({ when, until, init: !lazy }).subscribe(() => observer.next(container.component));
          } else {
            observer.next(container);
          }
        },
        error: err => observer.error(err),
        complete: () => observer.complete()
      });
    });
  }

  /**
   * Gets metadata for a target including merging of extension metadata.
   * @param {(object | null)} target
   * @returns {ViewLinkerMetadata}
   */
  getMetadata(target: object | null): ViewLinkerMetadata {
    if (!target) {
      return getDefaultMetadata();
    }

    const metadata = ViewLinker.readMetadata(target);

    return this.mergeMetadata(
      ...metadata.extensions.map(ext => this.getMetadata(ext)),
      metadata
    );
  }

  /**
   * Merges multiple metadata objects into one. The last item takes priority.
   * @param {...ViewLinkerMetadata[]} metadata
   * @returns {ViewLinkerMetadata}
   */
  mergeMetadata(...metadata: ViewLinkerMetadata[]): ViewLinkerMetadata {
    const result = getDefaultMetadata();

    result.inits = result.inits.concat(...pluck<ViewQueryInitConfig>('inits', metadata));
    result.inserts = result.inserts.concat(...pluck<ViewInsertConfig>('inserts', metadata));
    result.queries = result.queries.concat(...pluck<ViewQueryConfig>('queries', metadata));
    result.resolves = result.resolves.concat(...pluck<ViewResolveConfig>('resolves', metadata));
    result.unlinks = result.unlinks.concat(...pluck<string>('unlinks', metadata));

    return result;
  }

  private _insert<T>(_instance: object, config: ViewInsertConfig): Observable<any> {
    const { query, read } = config;

    return new Observable<any>(observer => {
      const from = this._viewManager.query<T>(config.from)[0];
      const view = from ? from.view : null;

      const existing = this._viewManager.query(query);

      // If the view exists and is attached, we don't need to insert it.
      if (existing.length && existing[0].isAttached) {
        return this._viewManager.subscribeToQuery(query).pipe(
          this.readQuery(read),
          filter(Boolean),
          take(1)
        ).subscribe(observer);
      } else if (view) {
        return this._manipulator.insert({ ...(config as any), from: view }).pipe(
          switchMap(() => this._viewManager.subscribeToQuery(query).pipe(
            this.readQuery(read),
            filter(Boolean),
            take(1)
          ))
        ).subscribe(observer);
      } else {
        observer.complete();
      }
    });
  }

  private _resolve<T>(_instance: object, config: ViewResolveConfig, options: ViewQueryReadOptions = {}): Observable<any> | ViewContainer<T>[] {
    const { query, read } = config;
    const _options = {
      lazy: false,
      ...(isObject(read) ? read : { type: read }),
      ...options
    };

    if (config.read === ViewQueryReadType.LIST) {
      return this._viewManager.query<T>(config.query);
    }

    return this._viewManager.subscribeToQuery(query).pipe(
      this.readQuery(_options),
      filter(Boolean),
      take(1)
    );
  }

  static readMetadata(target: any): ViewLinkerMetadata {
    if (!target) {
      return getDefaultMetadata();
    }

    return Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();
  }

  static resolveQueryReadType(arg: ViewQueryReadType|ViewQueryReadOptions): ViewQueryReadType | undefined {
    return isObject(arg) ? arg.type : arg;
  }
}
