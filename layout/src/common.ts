import { VNode } from 'snabbdom/vnode';

import { Token, Type } from './di';
import { Renderable, ConfiguredRenderable, RenderableArea } from './dom';

export enum XYDirection {
  X,
  Y
}

export const UNALLOCATED = Symbol('UNALLOCATED');

export type RenderableArg<T extends Renderable> = Type<T>|ConfiguredRenderable<T>|T;
export type Patch = (oldVNode: VNode|Node, newVNode: VNode) => VNode;

export interface ConfigureableType<T extends Renderable> extends Type<T> {
  configure?: (config: object) => ConfiguredRenderable<T>;
}

export interface DropArea { 
  item: RenderableDropTarget;
  area: RenderableArea;
  dragArea: RenderableArea;
};

export interface RenderableConfig<T extends Renderable> {
  use: Type<T>|ConfiguredRenderable<T>;
}

export enum DragStatus {
  START,
  STOP,
  DRAGGING  
}

export interface DragOptions<T> {
  host: T;
  startX: number;
  startY: number;
  threshold?: number;
}

export interface DragEvent<T> {
  host: T;
  x: number;
  y: number;
  pageX: number;
  pageY: number;  
  status: DragStatus;
}

export interface HighlightCoordinateArgs {
  pageX: number;
  pageY: number;
  dropArea: DropArea;
  dragArea: RenderableArea;
}

export interface DropTarget {
  handleDrop(item: Renderable, dropArea: DropArea, event: DragEvent<Renderable>): void;
  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea;
  onDropHighlightExit(): void;
}

export interface RenderableDropTarget extends Renderable, DropTarget {} 

export const DocumentRef = new Token('DocumentRef');
export const RootConfigRef = new Token('RootConfigRef');
export const ContainerRef = new Token('ContainerRef');
export const XYDirectionRef = new Token('XYDirectionRef');
export const ConfigurationRef = new Token('ConfigurationRef');
export const ElementRef = new Token('ElementRef');
export const RootLayoutRef = new Token('RootLayoutRef');
export const PatchRef = new Token('PatchRef');