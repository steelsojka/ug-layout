import { Token, Type } from './di';
import { Renderable, ConfiguredRenderable, RenderableArea } from './dom';

export enum XYDirection {
  X,
  Y
}

export const UNALLOCATED = Symbol('UNALLOCATED');

export type RenderableArg<T extends Renderable> = Type<T>|ConfiguredRenderable<T>|T;

export interface DropArea { 
  item: RenderableDropTarget;
  area: RenderableArea;
};

export interface RenderableConfig<T extends Renderable> {
  use: Type<T>|ConfiguredRenderable<T>;
}

export interface DropTarget {
  handleDrop(item: Renderable): void;
  getHighlightCoordinates(pageX: number, pageY: number, area: DropArea): RenderableArea;
  onDropHighlightExit(): void;
}

export interface RenderableDropTarget extends Renderable, DropTarget {} 

export const DocumentRef = new Token('DocumentRef');
export const RootConfigRef = new Token('RootConfigRef');
export const ContainerRef = new Token('ContainerRef');
export const XYDirectionRef = new Token('XYDirectionRef');
export const ConfigurationRef = new Token('ConfigurationRef');
export const ElementRef = new Token('ElementRef');