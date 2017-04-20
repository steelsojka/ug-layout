import { VIEW_HOOK_METADATA } from './common';

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