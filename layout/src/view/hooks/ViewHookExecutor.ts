import { VIEW_HOOK_METADATA, ViewHookMetadata, ViewHookConfig } from './common';
import { isObserver, isFunction, get } from '../../utils';
import { ViewContainer } from '../ViewContainer';
import { Subject } from '../../events';

export class ViewHookExecutor {
  readAll(target: Object): { [key: string]: ViewHookMetadata<ViewHookConfig>[] } {
    return Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};
  }

  read(target: Object, name: string): ViewHookMetadata<ViewHookConfig>[] {
    return this.readAll(target)[name] || [];
  }

  execute<T>(instance: T, hook: ViewHookMetadata<any>, arg?: any): any {
    const target = hook.observer ? instance[hook.observer] : instance[hook.key];

    if (isObserver(target)) {
      target.next(arg);
    } else if (isFunction(target)) {
      return target.call(instance, arg);
    }
  }

  executeList<T>(instance: T, hooks: ViewHookMetadata<any>[], arg?: any): any[] {
    return hooks.map(hook => this.execute(instance, hook, arg));
  }

  readAndExecute<T>(instance: T, target: Object, name: string, arg?: any): any[] {
    const hooks = this.read(target, name);

    return this.executeList(instance, hooks, arg);
  }

  readFromContainer(viewContainer: ViewContainer<any>): { [key: string]: ViewHookMetadata<any>[] } {
    const target = get(viewContainer, 'component.constructor.prototype');

    if (target) {
      return Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};
    }

    return {};
  }

  link<T>(viewContainer: ViewContainer<T>, target: Object): void {
    const hooks = this.readAll(target);

    for (const hookName of Object.keys(hooks)) {
      const hookMetaList = hooks[hookName] || [];

      for (const hookMeta of hookMetaList) {
        const { component } = viewContainer;

        if (hookMeta.observer && component) {
          const subject = new Subject();

          Object.defineProperties(component, {
            [hookMeta.observer]: {
              writable: false,
              enumerable: false,
              configurable: true,
              value: subject
            },
            [hookMeta.key]: {
              writable: false,
              enumerable: true,
              configurable: true,
              value: subject.asObservable()
            }
          });

          viewContainer.destroyed.subscribe(() => subject.complete());
        }
      }
    }
  }
}