import { Command } from './Command';
import { BusEvent, BusEventOptions } from '../events';

export interface MinimizeCommandOptions extends BusEventOptions {
  size?: number;
}

export class MinimizeCommand<T> extends Command<T> {
  options: MinimizeCommandOptions;
  
  constructor(
    protected _target: T,
    protected _options: MinimizeCommandOptions = {},
    protected _parent: BusEvent<any>|null = null
  ) {
    super(_target, _options, _parent);
  }
  
  get size(): number {
    return this.options.size || 0;
  }
}