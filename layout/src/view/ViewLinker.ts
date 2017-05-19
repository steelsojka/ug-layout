import { Inject, Injector } from '../di';
import { ViewManager, ViewManagerQueryEvent } from './ViewManager';
import { 
  VIEW_LINKER_METADATA, 
  ViewQueryConfig, 
  ViewQueryReadType, 
  ViewLinkerMetadata,
  ViewInsertConfig,
  ViewResolveConfig,
  ViewQueryReadOptions
} from './common';
import { ViewContainer, ViewContainerStatus } from './ViewContainer';
import { Subscription, Observable, Observer, Subject } from '../events';
import { get, isFunction, isObject } from '../utils';
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
    const metadata = this.readMetadata(instance);
    const subscription = new Subscription();

    for (const init of metadata.inits) {
      this._injector.invoke((...args) => instance[init.method](...args), init.injections);
    }

    for (const insert of metadata.inserts) {
      this.wireInsert(instance, insert);
    }

    for (const resolve of metadata.resolves) {
      this.wireResolve(instance, resolve);
    }
    
    for (const query of metadata.queries) {
      subscription.add(this.wireQuery(instance, query));
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
    const _unsubscribed = new Subject<void>();
    const unsubscribed = _unsubscribed.asObservable();

    subscription.add(() => {
      _unsubscribed.next();
      _unsubscribed.complete();
    });
    
    if (!isFunction(instance[method])) {
      throw new Error(`Can not wire method '${method}'. Method does not exist.`);
    }

    subscription.add(
      this.readQuery(this._viewManager.subscribeToQuery(config), read)
        .subscribe(arg => subscription.add(instance[method](arg, unsubscribed)))
    );

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
  readMetadata(instance: object): ViewLinkerMetadata {
    return ViewLinker.readMetadata(get(instance, 'constructor.prototype', null));
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
  readQuery<T>(query: Observable<ViewManagerQueryEvent<T>>, options?: ViewQueryReadType|ViewQueryReadOptions): Observable<any> {
    const _options = (isObject(options) ? options : { type: options }) as ViewQueryReadOptions;
    const {
      type = ViewQueryReadType.COMPONENT, 
      when = [ ViewContainerStatus.READY ], 
      until = [ ViewContainerStatus.FAILED ],
      lazy = true
    } = _options;
    
    return Observable.create((observer: Observer<any>) => {
      if (type === ViewQueryReadType.OBSERVABLE) {
        observer.next(query);
        observer.complete();
        
        return;
      } 
      
      return query.subscribe(event => {
        const { container } = event;

        if (type === ViewQueryReadType.EVENT) {
          observer.next(event);
          observer.complete();
        } else if (type === ViewQueryReadType.COMPONENT) {
          container.ready({ when, until, init: !lazy }).subscribe({
            next: () => observer.next(container.component),
            complete: () => observer.complete()
          });
        } else {
          observer.next(container);
          observer.complete();
        }
      });
    });
  }

  private _insert<T>(instance: object, config: ViewInsertConfig): Observable<any> {
    const from = this._viewManager.query<T>(config.from)[0];
    const view = from ? from.view : null;
    const { query, read } = config;

    return Observable.create((observer: Observer<any>) => {
      if (view) {
        this._manipulator.insert({ ...config, from: view }).subscribe(() => {
          this.readQuery(this._viewManager.subscribeToQuery(query), read).subscribe(observer);
        });  
      } else {
        observer.complete();
      }
    });
  }

  private _resolve<T>(instance: object, config: ViewResolveConfig, options: ViewQueryReadOptions = {}): Observable<any> {
    const { query, read } = config;
    const _options = {
      lazy: false,
      ...(isObject(read) ? read : { type: read }),
      ...options
    };
    
    return this.readQuery(this._viewManager.subscribeToQuery(query), _options);
  }

  static readMetadata(target: any): ViewLinkerMetadata {
    if (!target) {
      return getDefaultMetadata();
    }

    return Reflect.getOwnMetadata(VIEW_LINKER_METADATA, target) || getDefaultMetadata();
  }
}