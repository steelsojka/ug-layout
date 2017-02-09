export class AsyncEvent<T> {
  private _promise: Promise<T>;

  constructor(private _value: T) {
    this._promise = Promise.resolve(this._value);
  }

  get done(): Promise<T> {
    return this._promise;
  }

  get value(): T {
    return this._value;
  }

  wait(fn: () => any): void {
    this._promise = this._promise.then(value => {
      return Promise.resolve(fn()).then(() => value);
    });
  }

  static transfer<T, U>(event: AsyncEvent<T>, value: U): AsyncEvent<U> {
    const newEvent = new AsyncEvent(value);

    newEvent.wait(() => event.done);

    return newEvent;
  }
}