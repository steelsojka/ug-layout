import { ProviderArg, Type, Inject, Injector, Optional } from '../di';
import { ViewInterceptor } from './ViewInterceptor';
import { VIEW_INTERCEPTORS, ViewConfig } from './common';
import { ViewContainer } from './ViewContainer';
import { isFunction } from '../utils';

export class ViewInterceptorRunner {
  private _interceptors: ViewInterceptor[] = [];
  
  constructor(
    @Inject(VIEW_INTERCEPTORS) @Optional() _interceptors: ProviderArg[]|null,
    @Inject(Injector) private _injector: Injector
  ) {

    if (_interceptors) {
      for (const interceptor of _interceptors) {
        this._interceptors.push(this._injector.resolveAndInstantiate(interceptor));
      }
    }
  }

  config(config: ViewConfig): ViewConfig {
    return this._runInterceptors('config', config);
  }

  private _runInterceptors(method: string, ...args: any[]): any {
    return this._interceptors.reduce((result, interceptor) => {
      if (isFunction(interceptor[method])) {
        return interceptor[method](...args);
      }

      return result;
    }, undefined);
  }
}