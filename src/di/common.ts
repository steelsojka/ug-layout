import { Injector } from './Injector';

export interface Type<T> {
  new (...args: any[]): T;
}


export interface ClassProvider {
  provide: any;
  useClass: any;
}

export interface FactoryProvider {
  provide: any;
  useFactory: any;
  deps?: any[];
}

export interface ExistingProvider {
  provide: any;
  useExisting: any;
}

export interface ValueProvider {
  provide: any;
  useValue: any;
}

export type ProviderArg = ClassProvider|FactoryProvider|ExistingProvider|ValueProvider|Type<any>;
export type Provider = ClassProvider|FactoryProvider|ExistingProvider|ValueProvider;

export interface InjectionMetadata {
  lazy?: boolean;
  optional?: boolean;
  token?: any;
}

export const INJECT_PARAM_KEY = 'ugLayout:injections';
export const INJECTABLE_META_KEY = 'ugLayout:injectable';

export interface InjectableConfig {
  providers: ProviderArg[];
}

export type InjectableConfigArgs = {
  [P in keyof InjectableConfig]?: InjectableConfig[P];
}

export class Token {
  constructor(private name: string) {}

  toString(): string {
    return `Token(${this.name})`;
  }
}