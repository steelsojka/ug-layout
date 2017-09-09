export class ViewFailReason {
  constructor(private _reason: string) {}

  get reason() {
    return this._reason;
  }
}