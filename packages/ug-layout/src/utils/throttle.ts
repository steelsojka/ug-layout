function _throttle<T extends (...args: any[]) => any>(throttler: Function, fn: T, time: number): T {
  let timeId: number | null = null;

  return function(...args: any[]): any{
    if (timeId)  {
      throttler(timeId);
    }

    timeId = setTimeout(() => {
      timeId = null;
      fn.apply(this, ...args);
    }, time) as any;
  } as T;
}

export const throttle = _throttle.bind(null, () => {});
export const debounce = _throttle.bind(null, (id: number) => clearInterval(id));