import { Token, Type } from '../di';
import { View } from './View';
import { BeforeDestroyEvent } from '../events';
import { Renderable } from '../dom';
import { ViewContainer } from './ViewContainer';

export const ViewFactoriesRef = new Token('ViewFactoriesToken');
export const ViewComponentRef = new Token('ViewComponentRef');
export const VIEW_CONFIG_KEY = 'ugLayout:viewConfig';
export const VIEW_QUERY_METADATA = 'ugLayout:ViewQueryMetadata';

export enum ResolverStrategy {
  SINGLETON,
  TRANSIENT,
  REF
}

export enum ViewQueryReadType {
  CONTAINER,
  OBSERVABLE,
  COMPONENT  
}

export interface ViewQueryArgs {
  ref?: string;
  token?: any;
  id?: number;
}

export interface ViewQueryMetadata {
  queries: ViewQueryConfig[];
  inits: ViewQueryInitConfig[];
}

export interface ViewQueryInitConfig {
  method: string;
  injections: any[];
}

export interface ViewQueryConfigArgs extends ViewQueryArgs {
  read?: ViewQueryReadType;
}

export interface ViewQueryConfig {
  ref?: string;
  token?: any;
  id?: number;
  read: ViewQueryReadType;
  method: string;
}

export interface ViewComponentConfig {
  name: string;
  ref: string|null;
  cacheable: boolean;
  lazy: boolean;
  resolution: ResolverStrategy;
  container: Type<ViewContainer<any>>|null;
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