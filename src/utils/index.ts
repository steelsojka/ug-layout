export * from './Deferred';

export function isNumber(val: any): val is number {
  return typeof val === 'number';
}

export function clamp(val, min, max): number {
  return Math.min(max, Math.max(min, val));
}