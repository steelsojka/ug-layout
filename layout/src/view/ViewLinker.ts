import { Inject, Injector } from '../di';
import { ViewManager } from './ViewManager';
import { 
  VIEW_QUERY_METADATA, 
  ViewQueryConfig, 
  ViewQueryReadType, 
  ViewQueryMetadata,
  ViewInsertConfig,
  ViewResolveConfig,
  ViewQueryReadOptions
} from './common';
import { ViewContainer, ViewContainerStatus } from './ViewContainer';
import { Subscription, Observable, Observer, Subject } from '../events';
import { get, isFunction, isObject } from '../utils';
import { LayoutManipulator } from '../layout';
import { getDefaultMetadata } from './decorators';

export class ViewLinker {
  constructor(
    @Inject(ViewManager) private _viewManager: ViewManager,
    @Inject(Injector) private _injector: Injector,
    @Inject(LayoutManipulator) private _manipulator: LayoutManipulator
  ) {}
  
  /**
   * Hooks up linker methods with custom behavior for an instance object.
   * @param {object} instance 
   * @returns {Subscription} 
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

  wireInsert(instance: object, config: ViewInsertConfig): void {
    Object.defineProperty(instance, config.method, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: this._insert.bind(this, instance, config)
    })
  }
  
  wireResolve(instance: object, config: ViewResolveConfig): void {
    Object.defineProperty(instance, config.method, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: this._resolve.bind(this, instance, config)
    })
  }

  readMetadata(instance: object): ViewQueryMetadata {
    const target = get(instance, 'constructor.prototype', null);
    
    if (!target) {
      return getDefaultMetadata();
    }

    return Reflect.getOwnMetadata(VIEW_QUERY_METADATA, target) || getDefaultMetadata();
  }

  readQuery<T>(query: Observable<ViewContainer<T>>, options?: ViewQueryReadType|ViewQueryReadOptions): Observable<any> {
    const _options = (isObject(options) ? options : { type: options }) as ViewQueryReadOptions;
    const {
      type = ViewQueryReadType.COMPONENT, 
      when = [ ViewContainerStatus.READY ], 
      until = [ ViewContainerStatus.FAILED ]
    } = _options;
    
    return Observable.create((observer: Observer<any>) => {
      if (type === ViewQueryReadType.OBSERVABLE) {
        observer.next(query);
        observer.complete();
        
        return;
      } 
      
      return query.subscribe(container => {
        if (type === ViewQueryReadType.COMPONENT) {
          container.ready({ when, until }).subscribe({
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

  private _resolve<T>(instance: object, config: ViewResolveConfig): Observable<any> {
    const { query, read } = config;
    
    return this.readQuery(this._viewManager.subscribeToQuery(query), read);
  }
}