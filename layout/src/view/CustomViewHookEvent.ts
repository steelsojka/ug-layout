import { forwardRef, ForwardRef } from '../di';
import { Cancellable } from '../events';
import { ViewHookExecutor } from './hooks';
import { ViewContainer } from './ViewContainer';

export type CustomViewHookExecutor<T> = (container: ViewContainer<any>, executor: ViewHookExecutor, event: CustomViewHookEvent<T>) => any;

export interface CustomViewHookEventArgs<T> {
  name: string;
  arg: T;
  execute?: CustomViewHookExecutor<T>;
}

export class CustomViewHookEvent<T> extends Cancellable<null> {
  constructor(private _config: CustomViewHookEventArgs<T>) {
    super(null);
  }

  get execute(): CustomViewHookExecutor<T>|null {
    return this._config.execute || null;
  }

  get name(): string {
    return this._config.name;
  }

  get arg(): any[] {
    if (this._config.arg) {
      return ForwardRef.resolve(this._config.arg);
    }
    
    return [];
  }
}