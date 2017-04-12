export class StateContext {
  private _context: string;

  get context(): string {
    return this._context;
  }

  setContext(val: string): void {
    this._context = val;
  }
}