import { Token, Type } from '../di';
import { Renderable, RenderableConfig } from '../dom';
import { ViewContainer, ViewContainerStatus } from './ViewContainer';
import { LayoutInsertPosition } from '../layout';
import { RenderableArg } from '../common';
import { ConfiguredItem } from '../ConfiguredItem';

export const VIEW_COMPONENT_CONFIG = new Token<any>('ViewComponentConfig');
export const ViewComponentRef = new Token<any>('ViewComponentRef');
export const LinkerMetadataRef = new Token<any>('LinkerMetadataRef');
export const VIEW_CONFIG = new Token<ViewConfig>('ViewConfig');
export const VIEW_CONTAINER_CLASS = new Token<ViewContainer<any>>('VIEW_CONTAINER_CLASS');
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
  COMPONENT,
  EVENT,
  LIST
}

export enum CacheStrategy {
  NONE,
  PERSISTENT,
  RELOAD,
  RESET_ONLY
}

export enum ViewQueryResolveType {
  INIT,
  RESOLVE
}

export interface ViewQueryArgs {
  ref?: string;
  token?: any;
  id?: number;
  type?: ViewQueryResolveType[];
  immediate?: boolean;
}

export interface ViewQueryReadOptions {
  type?: ViewQueryReadType;
  when?: ViewContainerStatus[];
  until?: ViewContainerStatus[];
  lazy?: boolean;
}

export interface ViewResolveConfigArgs {
  query: ViewQueryArgs;
  read?: ViewQueryReadType|ViewQueryReadOptions;
}

export interface ViewResolveConfig extends ViewResolveConfigArgs {
  method: string;
}

export interface ViewLinkerMetadata {
  extensions: Function[];
  queries: ViewQueryConfig[];
  inits: ViewQueryInitConfig[];
  inserts: ViewInsertConfig[];
  resolves: ViewResolveConfig[];
  unlinks: string[];
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

export interface ViewQueryConfig extends ViewQueryConfigArgs {
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
  useFactory?: (() => any)|ConfiguredItem<any, any>;
  useValue?: any;
  useClass?: Type<any>|ConfiguredItem<any, any>;
  deps?: any[];
}