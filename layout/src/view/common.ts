import { Token, Type } from '../di';

export const ViewFactoriesRef = new Token('ViewFactoriesToken');
export const ViewComponentRef = new Token('ViewComponentRef');
export const VIEW_CONFIG_KEY = 'ugLayout:viewConfig';

export enum ResolverStrategy {
  SINGLETON,
  TRANSIENT
}

export interface ViewComponentConfig {
  name: string;
  resolution: ResolverStrategy;
}

export type ViewComponentConfigArgs = {
  [P in keyof ViewComponentConfig]?: ViewComponentConfig[P];
}

export interface ViewConfig {
  lazy?: boolean;
  token?: any;
  useFactory?: () => any;
  useValue?: Function;
  useName?: string;
  useClass?: Type<any>;
  deps?: any[];
}
