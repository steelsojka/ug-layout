import { forwardRef, ForwardRef } from '../di';
import { Cancellable } from '../events';

export interface CustomViewHookEventArgs {
  name: string;
  args?: any[];
}

export class CustomViewHookEvent extends Cancellable<null> {
  constructor(private _config: CustomViewHookEventArgs) {
    super(null);
  }

  get name(): string {
    return this._config.name;
  }

  get args(): any[] {
    if (this._config.args) {
      return this._config.args.map(arg => ForwardRef.resolve(arg));
    }
    
    return [];
  }
}