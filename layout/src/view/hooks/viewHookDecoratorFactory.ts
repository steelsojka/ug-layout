import { 
  VIEW_HOOK_METADATA, 
  ViewHookMetadata, 
  ViewHookConfig,
  OBSERVABLE_HOOK_PREFIX
} from './common';

export function viewHookDecoratorFactory<T extends ViewHookConfig>(name: string): (config?: T) => MethodDecorator & PropertyDecorator {
  return (config?: T) => {
    return (target: Object, key: string) => {
      const metadata: { [key: string]: ViewHookMetadata<T>[] } = Reflect.getOwnMetadata(VIEW_HOOK_METADATA, target) || {};

      if (!metadata.hasOwnProperty(name)) {
        metadata[name] = [];
      }

      metadata[name].push({
        key,
        observer: config && config.asObservable ? `${OBSERVABLE_HOOK_PREFIX}:${key}` : null,
        config: config || null
      });

      Reflect.defineMetadata(VIEW_HOOK_METADATA, metadata, target);
    };
  };
}