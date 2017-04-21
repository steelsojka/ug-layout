import { VIEW_HOOK_METADATA } from './common';

/**
 * Creates an {@link Observable} that emits when the provided hook is invoked. The value emitted
 * is the argument given to the hook. The hook completes when the view container is destroyed.
 * @export
 * @param {string} hook The name of the hook. If an invalid hook name is given no value is emitted.
 * @returns {PropertyDecorator} 
 */
export function ObserveViewHook(hook: string): PropertyDecorator {
  return (target: Object, key: string) => {
    const metadata = Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};

    if (!metadata[key]) {
      metadata[key] = [];
    }

    metadata[key].push(hook);

    Reflect.defineMetadata(VIEW_HOOK_METADATA, metadata, target);
  };
}