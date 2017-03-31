import { Inject, Injector } from '../di';
import { ViewManager } from './ViewManager';
import { VIEW_QUERY_METADATA, ViewQueryConfig, ViewQueryReadType, ViewQueryMetadata } from './common';
import { Subscription } from '../events';
import { get, isFunction } from '../utils';

export class ViewLinker {
  constructor(
    @Inject(ViewManager) private _viewManager: ViewManager,
    @Inject(Injector) private _injector: Injector
  ) {}
  
  autowire(instance: object): Subscription {
    const metadata = this.readMetadata(instance);
    const subs: Subscription[] = [];

    for (const init of metadata.inits) {
      this._injector.invoke((...args) => instance[init.method](...args), init.injections);
    }
    
    for (const query of metadata.queries) {
      subs.push(this.wireQuery(instance, query));
    }
    
    return new Subscription(() => subs.forEach(s => s.unsubscribe()));
  }

  wireQuery(instance: object, config: ViewQueryConfig): Subscription {
    const { read, method } = config;
    
    if (!isFunction(instance[method])) {
      throw new Error(`Can not wire method '${method}'. Method does not exist.`);
    }

    const query = this._viewManager.query(config);
    const invoke = arg => instance[method](arg);
    
    if (config.read === ViewQueryReadType.OBSERVABLE) {
      invoke(query);

      return new Subscription();
    }
    
    return query.subscribe(container => {
      if (read === ViewQueryReadType.COMPONENT) {
        container.ready().then(() => {
          invoke(container.component);
        });
      } else {
        invoke(container);
      }
    });
  }

  readMetadata(instance: object): ViewQueryMetadata {
    const target = get(instance, 'constructor.prototype', null);
    
    if (!target) {
      return { queries: [], inits: [] };
    }

    return Reflect.getOwnMetadata(VIEW_QUERY_METADATA, target) || [];
  }
}