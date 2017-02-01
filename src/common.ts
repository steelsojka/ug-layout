import { Token } from './di';
import { Renderable } from './dom';

export interface Type<T> {
  new (...args: any[]): T;
}

export enum XYDirection {
  X,
  Y
}

export interface RenderableConfig {
  use: Type<Renderable>;
  children: RenderableConfig[];
}

export const ParentLayoutRef = new Token('ParentLayoutRef');
export const RootConfigRef = new Token('RootConfigRef');
export const ContainerRef = new Token('ContainerRef');
export const XYDirectionRef = new Token('XYDirectionRef');
export const ConfigurationRef = new Token('ConfigurationRef');