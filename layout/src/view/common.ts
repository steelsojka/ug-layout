import { Token, Type } from '../di';
import { View } from './View';
import { BeforeDestroyEvent } from '../events';
import { Renderable } from '../dom';

export const ViewFactoriesRef = new Token('ViewFactoriesToken');
export const ViewComponentRef = new Token('ViewComponentRef');
export const VIEW_CONFIG_KEY = 'ugLayout:viewConfig';
export const VIEW_INTERCEPTORS = new Token('ViewInterceptors');

export enum ResolverStrategy {
  SINGLETON,
  TRANSIENT,
  REF
}

export interface ViewComponentConfig {
  name: string;
  ref: string|null;
  cacheable: boolean;
  lazy: boolean;
  resolution: ResolverStrategy;
}

export type ViewComponentConfigArgs = {
  [P in keyof ViewComponentConfig]?: ViewComponentConfig[P];
}

export interface ViewConfig {
  lazy?: boolean;
  cacheable?: boolean;
  token?: any;
  ref?: string|null;
  resolution?: ResolverStrategy;
  useFactory?: () => any;
  useValue?: any;
  useClass?: Type<any>;
  deps?: any[];
}

export interface OnAttach {
  ugOnAttach(view: View): void;
}

export interface OnDetach {
  ugOnDetach(): void;
}

export interface OnResize {
  ugOnResize(dimensions: { width: number, height: number }): void;
}

export interface OnVisiblityChange {
  ugOnVisiblityChange(isVisible: boolean): void;
}

export interface OnBeforeDestroy {
  ugOnBeforeDestroy(event: BeforeDestroyEvent<any>): void;
}