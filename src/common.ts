import { Token, Type } from './di';
import { Renderable, ConfiguredRenderable } from './dom';

export enum XYDirection {
  X,
  Y
}

export const UNALLOCATED = Symbol('UNALLOCATED');

export type RenderableArg<T extends Renderable> = Type<T>|ConfiguredRenderable<T>;

export interface RenderableConfig<T extends Renderable> {
  use: Type<T>|ConfiguredRenderable<T>;
}

export const DocumentRef = new Token('DocumentRef');
export const ParentLayoutRef = new Token('ParentLayoutRef');
export const RootConfigRef = new Token('RootConfigRef');
export const ContainerRef = new Token('ContainerRef');
export const XYDirectionRef = new Token('XYDirectionRef');
export const ConfigurationRef = new Token('ConfigurationRef');
export const ElementRef = new Token('ElementRef');