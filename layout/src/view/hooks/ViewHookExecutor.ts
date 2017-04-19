import { VIEW_HOOK_METADATA, ViewHookMetadata } from './common';
import { isFunction, get } from '../../utils';
import { ViewContainer } from '../ViewContainer';
import { Subject } from '../../events';

export class ViewHookExecutor {
  private _interceptors = new WeakMap<any, { [key: string]: Function[] }>();

  readAll(target: Object): ViewHookMetadata {
    return Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};
  }

  read(target: Object, name: string): string[] {
    return this.readAll(target)[name] || [];
  }

  execute<T>(instance: T, method: string, arg?: any): any {
    const target = instance[method];
    let returnValue;

    if (isFunction(target)) {
      returnValue = target.call(instance, arg);
    }

    const interceptorMap = this._interceptors.get(instance) || {};
    const interceptors = interceptorMap[method] || [];

    for (const interceptor of interceptors) {
      interceptor(arg);
    }

    return returnValue;
  }

  registerInterceptor(instance: any, hook: string, fn: Function): void {
    const map = this._interceptors.get(instance) || {};
    const list = map[hook] = map[hook] || [];

    list.push(fn);

    this._interceptors.set(instance, map);
  }

  readFromContainer(viewContainer: ViewContainer<any>): ViewHookMetadata {
    const target = get(viewContainer, 'component.constructor.prototype');

    if (target) {
      return Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};
    }

    return {};
  }

  link<T>(viewContainer: ViewContainer<T>, target: Object): void {
    const hooks = this.readAll(target);
    const { component } = viewContainer;

    if (!component) {
      return;
    }

    for (const hookObservableName of Object.keys(hooks)) {
      const hookNames = hooks[hookObservableName] || [];
      let subject = component[hookObservableName];

      if (!subject) {
        subject = new Subject<any>();

        Object.defineProperty(component, name, {
          writable: true,
          configurable: true,
          enumerable: true,
          value: subject.asObservable()
        });

        viewContainer.destroyed.subscribe(() => subject.complete());
      } 

      for (const name of hookNames) {
        this.registerInterceptor(component, name, arg => subject.next(arg));
      }
    }
  }
}