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
    if (!isObject(result)) {
      return defaultValue; 
    }
    
    result = obj[pathParts.shift() as any];
  }

  return result === undefined ? defaultValue : result;
}

export const uid: () => number = (() => {
  let uid = 0;
  
  return () => uid++;
})();