import { viewHookDecoratorFactory } from './viewHookDecoratorFactory';
import { ViewOnResolveConfig, ViewHookConfig } from './common';

export const ViewOnResolve = viewHookDecoratorFactory<ViewOnResolveConfig>('ugOnResolve');
export const ViewOnAttach = viewHookDecoratorFactory<ViewHookConfig>('ugOnAttach');
export const ViewOnDetach = viewHookDecoratorFactory<ViewHookConfig>('ugOnDetach');
export const ViewOnResize = viewHookDecoratorFactory<ViewHookConfig>('ugOnResize');
export const ViewOnVisibilityChanges = viewHookDecoratorFactory<ViewHookConfig>('ugOnVisibilityChanges');
export const ViewOnBeforeDestroy = viewHookDecoratorFactory<ViewHookConfig>('ugOnBeforeDestroy');
export const ViewOnInit = viewHookDecoratorFactory<ViewHookConfig>('ugOnInit');