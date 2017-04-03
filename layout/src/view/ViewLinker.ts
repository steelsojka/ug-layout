import { Inject, Injector } from '../di';
import { ViewManager } from './ViewManager';
import { 
  VIEW_QUERY_METADATA, 
  ViewQueryConfig, 
  ViewQueryReadType, 
  ViewQueryMetadata,
  ViewInsertConfig,
  ViewResolveConfig
} from './common';
import { ViewContainer } from './ViewContainer';
import { Subscription, Observable, Observer } from '../events';
import { get, isFunction } from '../utils';
import { LayoutManipulator } from '../layout';

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
    
    if (!isFunction(instance[method])) {
      throw new Error(`Can not wire method '${method}'. Method does not exist.`);
    }

    return this.readQuery(this._viewManager.subscribeToQuery(config), read)
      .subscribe(arg => instance[method](arg));
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
      return { queries: [], inits: [], inserts: [], resolves: [] };
    }

    return Reflect.getOwnMetadata(VIEW_QUERY_METADATA, target) || [];
  }

  readQuery<T>(query: Observable<ViewContainer<T>>, type: ViewQueryReadType): Observable<any> {
    return Observable.create((observer: Observer<any>) => {
      if (type === ViewQueryReadType.OBSERVABLE) {
        observer.next(query);
        observer.complete();
        
        return;
      } 
      
      const subscription = query.subscribe(container => {
        if (type === ViewQueryReadType.COMPONENT) {
          container.ready().then(() => {
            observer.next(container.component);
          });
        } else {
          observer.next(container);
        }
      });

      return () => subscription.unsubscribe();
    });
  }

  private _insert<T>(instance: object, config: ViewInsertConfig): Promise<any> {
    const from = this._viewManager.query<T>(config.from)[0];
    const view = from ? from.view : null;
    const { query, read = ViewQueryReadType.COMPONENT } = config;

    return new Promise((resolve, reject) => {
      if (view) {
        this._manipulator.insert({ ...config, from: view })
          .subscribe(child => {
            this.readQuery(this._viewManager.subscribeToQuery(query), read)
              .first()
              .subscribe(resolve);
          });  
      }
    });
  }

  private _resolve<T>(instance: object, config: ViewResolveConfig): Promise<any> {
    const { query, read = ViewQueryReadType.COMPONENT } = config;
    
    return this.readQuery(this._viewManager.subscribeToQuery(query), read)
      .first()
      .toPromise();
  }
}