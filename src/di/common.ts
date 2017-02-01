import { Injector } from './Injector';

export interface Provider {
  provide: any;
  useClass?: any;
  useValue?: any;
  useFactory?: any;
  useExisting?: any;
  deps?: any[];
}

export interface InjectionMetadata {
  lazy?: boolean;
  optional?: boolean;
  token?: any;
}

export const INJECT_PARAM_KEY = 'ugLayout:injections';

export class Token {
  constructor(private name: string) {}

  toString(): string {
    return `Token(${this.name})`;
  }
}