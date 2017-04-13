export const VIEW_HOOK_METADATA = 'ugLayout:ViewHookMetadata';
export const OBSERVABLE_HOOK_PREFIX = '__ugViewHookObserver';

export interface ViewHookConfig {
  asObservable?: boolean;
}

export interface ViewOnResolveConfig extends ViewHookConfig {
  whenCached?: boolean;
  cachedOnly?: boolean;
}

export interface ViewHookMetadata<T> {
  key: string;
  observer: string|null;
  config: T|null;
}
