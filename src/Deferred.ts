export class Deferred<T> {
  promise: Promise<T>;
  resolve: (val?: T|Promise<T>) => void;
  reject: (val?: any) => void;
  
  constructor() {
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }
}