import { Subject } from 'rxjs';

import { VIEW_HOOK_METADATA } from './common';
import { isFunction } from '../../utils';
import { ViewContainer } from '../ViewContainer';
import { getDefaultMetadata } from './decorators';

/**
 * Executes view hooks on a component instance.
 * @export
 * @class ViewHookExecutor
 */
export class ViewHookExecutor {
  private _interceptors = new WeakMap<any, { [key: string]: Function[] }>();

  /**
   * Invokes the view hook on the instance with the given argument.
   * This will also invoke any interceptors for the hook as well after the hook
   * on the component has been invoked.
   * @template T
   * @param {T} instance
   * @param {string} method
   * @param {*} [arg]
   * @returns {*}
   */
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

  /**
   * Registers an interceptor for a hook on a given instance.
   * @param {*} instance
   * @param {string} hook
   * @param {Function} fn
   */
  registerInterceptor(instance: any, hook: string, fn: Function): void {
    const map = this._interceptors.get(instance) || {};
    const list = map[hook] = map[hook] || [];

    list.push(fn);

    this._interceptors.set(instance, map);
  }

  /**
   * Links a resolved view container to any hook observables. Metadata is read from the given target.
   * @template T The component type for the view container.
   * @param {ViewContainer<T>} viewContainer
   * @param {Object} target
   */
  link<T>(viewContainer: ViewContainer<T>, target: Object): void {
    const metadata = Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || getDefaultMetadata();
    const { component } = viewContainer;

    if (!component) {
      return;
    }

    for (const { prop, key } of metadata.containerProps) {
      Object.defineProperty(component, key, {
        configurable: true,
        get: () => viewContainer[prop]
      });
    }

    for (const hookObservableName of Object.keys(metadata.observers)) {
      const hookNames = metadata.observers[hookObservableName] || [];
      const subject = new Subject<any>();

      Object.defineProperty(component, hookObservableName, {
        writable: true,
        configurable: true,
        enumerable: true,
        value: subject.asObservable()
      });

      viewContainer.destroyed.subscribe(() => subject.complete());

      for (const name of hookNames) {
        this.registerInterceptor(component, name, arg => subject.next(arg));
      }
    }
  }
}