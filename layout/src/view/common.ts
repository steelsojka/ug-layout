import { Token, Type } from '../di';
import { View } from './View';
import { BeforeDestroyEvent } from '../events';
import { Renderable, RenderableConfig } from '../dom';
import { ViewContainer, ViewContainerStatus } from './ViewContainer';
import { LayoutInsertPosition } from '../layout';
import { RenderableArg } from '../common';

export const ViewComponentRef = new Token('ViewComponentRef');
export const LinkerMetatdataRef = new Token('LinkerMetadataRef');
export const VIEW_CONFIG_KEY = 'ugLayout:viewConfig';
export const VIEW_LINKER_METADATA = 'ugLayout:ViewLinkerMetadata';

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

export enum CacheStrategy {
  NONE,
  PERSISTENT,
  RELOAD 
}

export interface ViewQueryArgs {
  ref?: string;
  token?: any;
  id?: number;
}

export interface ViewQueryReadOptions {
  type?: ViewQueryReadType;
  when?: ViewContainerStatus[];
  until?: ViewContainerStatus[];
}

export interface ViewResolveConfigArgs {
  query: ViewQueryArgs;
  read?: ViewQueryReadType|ViewQueryReadOptions;
}

export interface ViewResolveConfig extends ViewResolveConfigArgs {
  method: string;
}

export interface ViewLinkerMetadata {
  queries: ViewQueryConfig[];
  inits: ViewQueryInitConfig[];
  inserts: ViewInsertConfig[];
  resolves: ViewResolveConfig[];
}

export interface ViewQueryInitConfig {
  method: string;
  injections: any[];
}

export interface ViewQueryConfigArgs extends ViewQueryArgs {
  read?: ViewQueryReadType|ViewQueryReadOptions;
}

export interface ViewInsertConfigArgs {
  from: ViewQueryArgs;
  into: Type<Renderable>|Type<Renderable>[];
  insert: RenderableArg<Renderable>;
  query: ViewQueryArgs;
  position?: LayoutInsertPosition;
  index?: number;
  read?: ViewQueryReadType|ViewQueryReadOptions;
  tag?: string;
}

export interface ViewInsertConfig extends ViewInsertConfigArgs {
  method: string;
}

export interface ViewQueryConfig {
  ref?: string;
  token?: any;
  id?: number;
  read: ViewQueryReadType|ViewQueryReadOptions;
  method: string;
}

export interface ViewComponentConfig {
  name: string;
  ref: string|null;
  caching: CacheStrategy|null;
  lazy: boolean;
  resolution: ResolverStrategy;
  container: Type<ViewContainer<any>>|null;
}

export type ViewComponentConfigArgs = {
  [P in keyof ViewComponentConfig]?: ViewComponentConfig[P];
}

export interface ViewConfig extends RenderableConfig {
  lazy?: boolean;
  caching?: CacheStrategy|null;
  token?: any;
  ref?: string|null;
  resolution?: ResolverStrategy;
  useFactory?: () => any;
  useValue?: any;
  useClass?: Type<any>;
  deps?: any[];
}

export interface OnResolve {
  ugOnResolve(viewContainer: ViewContainer<any>): void|Promise<any>;
}

export interface OnCacheResolve {
  ugOnCacheResolve(viewContainer: ViewContainer<any>): void|Promise<any>;
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