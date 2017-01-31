import { INJECT_PARAM_KEY } from './common';

export function Inject(token: any): ParameterDecorator {
  return function(target: Object, key: string, index: number) {
    const existingInjections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, target, key) || [];

    existingInjections[index] = token;

    Reflect.defineMetadata(INJECT_PARAM_KEY, existingInjections, target, key);
  }    
}