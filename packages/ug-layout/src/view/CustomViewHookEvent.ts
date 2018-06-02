import { ForwardRef } from '../di';
import { Cancellable } from '../events';
import { ViewHookExecutor } from './hooks';
import { ViewContainer } from './ViewContainer';

export type CustomViewHookExecutor<T> = (container: ViewContainer<any>, executor: ViewHookExecutor, event: CustomViewHookEvent<T>) => any;

export interface CustomViewHookEventArgs<T> {
  /**
   * The name of the method to invoke.
   * @type {string}
   */
  name: string;
  /**
   * The argument to provide to the hook. This supports a {@link ForwardRef}
   * if the argument needs to be resolved lazily.
   * @type {T}
   */
  arg: T;
  /**
   * Invoked if custom execution logic is required. This method is provided the
   * {@link ViewHookExecutor} in order to perform the hook invocation.
   * @type {CustomViewHookExecutor<T>}
   */
  execute?: CustomViewHookExecutor<T>;
}

/**
 * Invokes a custom view hook on any views that receive this event.
 * @export
 * @class CustomViewHookEvent
 * @extends {Cancellable<null>}
 * @template T
 */
export class CustomViewHookEvent<T> extends Cancellable<null> {
  constructor(private _config: CustomViewHookEventArgs<T>) {
    super(null);
  }

  /**
   * Custom invocation method.
   * @readonly
   * @type {(CustomViewHookExecutor<T>|null)}
   */
  get execute(): CustomViewHookExecutor<T>|null {
    return this._config.execute || null;
  }

  /**
   * Name of the method to invoke.
   * @readonly
   * @type {string}
   */
  get name(): string {
    return this._config.name;
  }

  /**
   * The argument to provide to the hook.
   * @readonly
   * @type {(T|null)}
   */
  get arg(): T|null {
    if (this._config.arg) {
      return ForwardRef.resolve(this._config.arg);
    }

    return null;
  }
}