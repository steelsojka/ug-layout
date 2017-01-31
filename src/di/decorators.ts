import { INJECT_PARAM_KEY } from './common';

export function Inject(token: any): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { token });
  };
}

export function Optional(): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { optional: true });
  };
}

export function Lazy(): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { lazy: true });
  };
}

function addParamEntryProperty(target: Object, key: string, index: number, keyValue: {[key: string]: any}) { 
  const existingInjections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, target, key) || [];

  if (!existingInjections[index]) {
    existingInjections[index] = {
      token: null,
      optional: false,
      lazy: false
    };
  }

  existingInjections[index] = Object.assign(existingInjections[index], keyValue);
  Reflect.defineMetadata(INJECT_PARAM_KEY, existingInjections, target, key);
}