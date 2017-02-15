import { Token, Type } from '../di';

export const ViewFactoriesRef = new Token('ViewFactoriesToken');
export const ViewComponentRef = new Token('ViewComponentRef');
export const VIEW_CONFIG_KEY = 'ugLayout:viewConfig';

export enum ResolverStrategy {
  SINGLETON,
  TRANSIENT
}

export interface ViewComponentConfig {
  name?: string;
  resolution?: ResolverStrategy;
}

export interface ViewConfig {
  token?: any;
  useFactory?: () => any;
  useValue?: Function;
  useName?: string;
  useClass?: Type<any>;
  deps?: any[];
}
