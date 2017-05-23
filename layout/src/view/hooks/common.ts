import { Renderable } from '../../dom';
import { BeforeDestroyEvent } from '../../events';
import { ViewContainer } from '../ViewContainer';

export const VIEW_HOOK_METADATA = 'ugLayout:ViewHookMetadata';

export interface ViewHookMetadata { 
  observers: { [key: string]: string[] };
  containerProps: Array<{ prop: string, key: string }>;
};

export interface ResolveState {
  fromCache: boolean;
}

export interface SizeChanges {
  width: number;
  height: number;
}

export interface ViewOnResolve {
  ugOnResolve(state: ResolveState): void;
}

export interface ViewOnSizeChange {
  ugOnSizeChange(changes: SizeChanges): void;
}

export interface ViewOnAttach {
  ugOnAttach(container: Renderable): void;
}

export interface ViewOnDetach {
  ugOnDetach(): void;
}

export interface ViewOnVisibilityChange {
  ugOnVisibilityChange(isVisible: boolean); void;
}

export interface ViewOnBeforeDestroy {
  ugOnBeforeDestroy(event: BeforeDestroyEvent<any>): void;
}

export interface ViewOnInit<T> {
  ugOnInit(container: ViewContainer<T>): void;
}