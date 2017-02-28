import { Command } from '../commands';

export interface CustomViewHookCommandArgs {
  name: string;
  args?: any[];
}

export class CustomViewHookCommand extends Command<null> {
  constructor(private _config: CustomViewHookCommandArgs) {
    super(null);
  }

  get name(): string {
    return this._config.name;
  }

  get args(): any[] {
    return Array.isArray(this._config.args) ? this._config.args : [];
  }
}