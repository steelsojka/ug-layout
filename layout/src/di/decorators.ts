import { 
  INJECT_PARAM_KEY, 
  InjectableConfigArgs,
  INJECTABLE_META_KEY
} from './common';

/**
 * Marks a param to be injected with the registered provider
 * registered with the token.
 * @export
 * @param {*} token 
 * @returns {ParameterDecorator} 
 */
export function Inject(token: any): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { token });
  };
}

/**
 * Marks a dependency as optional. Returns null if not found.
 * @export
 * @returns {ParameterDecorator} 
 */
export function Optional(): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { optional: true });
  };
}

/**
 * Marks a dependency as lazy. Injects a function that will
 * resolve the dependency.
 * @export
 * @returns {ParameterDecorator} 
 * @example
 * class MyClass {
 *   constructor(
 *     @Inject(MyToken) @Lazy() private getMyService: () => MyService
 *   ) {
 *     console.log(getMyService()); // => myService
 *   }
 * }
 */
export function Lazy(): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { lazy: true });
  };
}

/**
 * Will only check the injector creating the dependency. It will not
 * check any parents.
 * @export
 * @returns {ParameterDecorator} 
 */
export function Self(): ParameterDecorator {
  return (target: Object, key: string, index: number) => {
    addParamEntryProperty(target, key, index, { self: true });
  };
}

/**
 * Marks a dependency as injectable. When the dependency is created using
 * `Injector.fromInjectable` the dependency can define some scoped dependencies.
 * @export
 * @param {InjectableConfigArgs} [config={}] 
 * @returns {ClassDecorator} 
 * @example
 * @Injectabled({
 *   providers: [
 *     { provide: MyToken, useValue: 'blorg' } 
 *   ]
 * })
 * class MyClass {
 *   constructor(
 *     @Inject(MyToken) private myBlorg: string
 *   ) {
 *     console.log(myBlorg); // => 'blorg
 *   }
 * }
 * 
 * Injector.fromInjectable(MyClass).get(MyToken) // => 'blorg';
 */
export function Injectable(config: InjectableConfigArgs = {}): ClassDecorator {
  return (target: Function) => {
    if (!Array.isArray(config.providers)) {
      config.providers = [];
    }
    
    Reflect.defineMetadata(INJECTABLE_META_KEY, config, target);
  };
}

function addParamEntryProperty(target: Object, key: string, index: number, keyValue: {[key: string]: any}) { 
  const existingInjections = Reflect.getOwnMetadata(INJECT_PARAM_KEY, target, key) || [];

  if (!existingInjections[index]) {
    existingInjections[index] = {
      token: null,
      optional: false,
      lazy: false,
      self: false
    };
  }

  existingInjections[index] = Object.assign(existingInjections[index], keyValue);
  Reflect.defineMetadata(INJECT_PARAM_KEY, existingInjections, target, key);
}
