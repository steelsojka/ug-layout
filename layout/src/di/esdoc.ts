/**
 * @interface
 * @template T 
 */
export class Type<T> {
  constructor(...args: any[]) {}
}

/**
 * @interface
 */
export class ClassProvider {
  /**
   * The token to provide.
   * @type {*}
   */
  provide: any = null;

  /**
   * The constructor to use.
   * @type {*}
   */
  useClass: any = null;
}

/**
 * @interface
 */
export class FactoryProvider {
  /**
   * The token to provide.
   * @type {*}
   */
  provide: any = null;
  /**
   * The factory to use to generate the value.
   * @type {*}
   */
  useFactory: any = null;
  /**
   * Dependencies to inject into the factory.
   * @type {*[]}
   */
  deps?: any[] = [];
}

/**
 * @interface
 */
export class ExistingProvider {
  /**
   * The token to provide.
   * @type {*}
   */
  provide: any = null;
  /**
   * The existing token to use.
   * @type {*}
   */
  useExisting: any = null;
}

/**
 * @interface
 */
export class ValueProvider {
  /**
   * The token to provide.
   * @type {*}
   */
  provide: any = null;
  /**
   * The value to use.
   * @type {*}
   */
  useValue: any = null;
}

/**
 * @interface
 */
export class InjectionMetadata {
  /**
   * @type {boolean}
   */
  self?: boolean = false;
  /**
   * @type {boolean}
   */
  lazy?: boolean = false;
  /**
   * @type {boolean}
   */
  optional?: boolean = false;
  /**
   * @type {*}
   */
  token?: any = false;
}

/**
 * @typedef {ValueProvider|ClassProvider|ExistingProvider|FactoryProvider} Provider
 */
/**
 * @typedef {Provider|Type<*>} ProviderArg
 */