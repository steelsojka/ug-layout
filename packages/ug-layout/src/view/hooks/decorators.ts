import { VIEW_HOOK_METADATA, ViewHookMetadata } from './common';

/**
 * Creates an {@link Observable} that emits when the provided hook is invoked. The value emitted
 * is the argument given to the hook. The hook completes when the view container is destroyed.
 * @export
 * @param {string} hook The name of the hook. If an invalid hook name is given no value is emitted.
 * @returns {PropertyDecorator} 
 */
export function ObserveViewHook(hook: string): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata = Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || getDefaultMetadata();

    if (!metadata.observers[key]) {
      metadata.observers[key] = [];
    }

    metadata.observers[key].push(hook);

    Reflect.defineMetadata(VIEW_HOOK_METADATA, metadata, target);
  };
}

export function ViewContainerProp(property: string): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata = Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || getDefaultMetadata();

    metadata.containerProps.push({ prop: property, key });

    Reflect.defineMetadata(VIEW_HOOK_METADATA, metadata, target);
  };
}

export function getDefaultMetadata(): ViewHookMetadata {
  return {
    observers: {},
    containerProps: []
  };
}