import { Observer } from '../events';

export * from './Deferred';

export function isNumber(val: any): val is number {
  return typeof val === 'number';
}

export function isString(val: any): val is string {
  return typeof val === 'string';
}

export function clamp(val, min, max): number {
  return Math.min(max, Math.max(min, val));
}

export function isObject(val: any): val is object {
  return (typeof val === 'object' || isFunction(val)) && val !== null;
}

export function isObserver<T>(val: any): val is Observer<T> {
  return isObject(val) && isFunction(val['next']);
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

export function isBoolean(val: any): val is boolean {
  return typeof val === 'boolean';
}

export function isUndefined(val: any): val is undefined {
  return val === undefined;
}
export function negate(fn: (...args: any[]) => any): (...args: any[]) => boolean {
  return (...args: any[]) => !fn(...args);
}

export function get<T>(obj: any, path: string, defaultValue?: T, comparer: (v) => boolean = isUndefined): T {
  const pathParts = path.split('.');

  let result = obj;

  while (pathParts.length) {
    if (!isObject(result)) {
      return defaultValue as T; 
    }
    
    result = result[pathParts.shift() as any];
  }

  return comparer(result) ? defaultValue : result;
}

export function propEq(prop: string, value: any): (obj: any) => boolean {
  return function(obj: any): boolean {
    return isObject(obj) && obj[prop] === value;
  };
}

export function eq(value: any): (value: any) => boolean {
  return function(val: any): boolean {
    return val === value;
  };
}

export function round(val: number, precision: number = 0): number {
  const multiplier = Math.pow(10, precision);

  return Math.round(val * multiplier) / multiplier;
}

export function isPromise<T>(value: any): value is Promise<T> {
  return isObject(value) && isFunction(value['then']) && isFunction(value['catch']);
}

export function partition<T>(list: T[], predicate: (v: T) => boolean): [T[], T[]] {
  const pass: T[] = [];  
  const fail: T[] = [];  

  for (const item of list) {
    if (predicate(item)) {
      pass.push(item);
    } else {
      fail.push(item);
    }
  }

  return [ pass, fail ];
}

export function defaults<T>(dest: T, src: T|object|null): T {
  if (!dest) {
    return (src || {}) as T;
  }
  
  if (src) {
    for (const key of Object.keys(src)) {
      if (dest[key] === undefined) {
        dest[key] = src[key];
      }
    }
  }

  return dest;
}

export const uid: () => number = (() => {
  let uid = 0;
  
  return () => uid++;
})();