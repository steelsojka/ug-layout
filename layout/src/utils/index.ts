export * from './Deferred';

export function isNumber(val: any): val is number {
  return typeof val === 'number';
}

export function clamp(val, min, max): number {
  return Math.min(max, Math.max(min, val));
}

export function isObject(val: any): boolean {
  return typeof val === 'object';
}

export function isFunction(val: any): val is Function {
  return typeof val === 'function';
}

export function get<T>(obj: any, path: string, defaultValue?: T): T|undefined {
  const pathParts = path.split('.');

  let result = obj;

  while (pathParts.length) {
    if (!isObject(result) || result === null) {
      return defaultValue; 
    }
    
    result = obj[pathParts.shift() as any];
  }

  return result === undefined ? defaultValue : result;
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
  return isObject(value) && isFunction(value.then) && isFunction(value.catch);
}

export const uid: () => number = (() => {
  let uid = 0;
  
  return () => uid++;
})();