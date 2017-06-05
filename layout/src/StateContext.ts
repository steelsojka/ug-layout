import { ContextType } from './common';

export class StateContext {
  private _context: ContextType;

  get context(): ContextType {
    return this._context;
  }

  setContext(val: ContextType): void {
    this._context = val;
  }
}