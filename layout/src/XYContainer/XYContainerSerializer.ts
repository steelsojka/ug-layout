import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { SerializerContainer, Serializer, Serialized } from '../serialization';
import { XYContainer } from './XYContainer';
import { Row } from './Row';
import { Column } from './Column';
import { UNALLOCATED, XYDirection } from '../common';

export interface SerializedXYContainerItem {
  use: Serialized;
  tags: string[];
  ratio: number|null;
  initialSize?: number;
  minSizeX: number;
  maxSizeX: number;
  minSizeY: number;
  maxSizeY: number;
  fixed: boolean;
  minimized: boolean;
}

export interface SerializedXYContainer extends SerializedRenderable {
  direction: XYDirection;
  static: boolean;
  splitterSize: number;
  children: SerializedXYContainerItem[];
}

export class XYContainerSerializer implements Serializer<XYContainer, SerializedXYContainer> {
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  serialize(node: XYContainer): SerializedXYContainer {
    return {
      name: 'XYContainer',
      tags: [ ...node.tags ],
      static: node.isStatic,
      direction: node.direction,
      splitterSize: node.splitterSize,
      children: node.getChildren().map(item => {
        return {
          use: this._container.serialize(item.item),
          tags: [ ...item.tags ],
          ratio: item.ratio === UNALLOCATED ? null : item.ratio as number,
          initialSize: item.initialSize ? item.initialSize : undefined,
          minimized: item.isMinimized,
          minSizeX: item.minSizeX,
          maxSizeX: item.maxSizeX,
          minSizeY: item.minSizeY,
          maxSizeY: item.maxSizeY,
          fixed: item.fixed
        }
      })
    };    
  }

  deserialize(node: SerializedXYContainer): ConfiguredRenderable<XYContainer> {
    const Ctor = node.direction === XYDirection.X ? Row : Column;
    
    return Ctor.configure({
      splitterSize: node.splitterSize,
      static: node.static,
      tags: node.tags,
      children: node.children.map(child => {
        return {
          use: this._container.deserialize(child.use),
          ratio: child.ratio == null ? undefined : child.ratio as number,
          tags: child.tags,
          initialSize: child.initialSize,
          minSizeX: child.minSizeX,
          maxSizeX: child.maxSizeX,
          minSizeY: child.minSizeY,
          maxSizeY: child.maxSizeY,
          minimized: child.minimized,
          fixed: child.fixed
        }; 
      })      
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('XYContainer', XYContainer);
    container.registerSerializer(Row, XYContainerSerializer, { skipRegister: true });
    container.registerSerializer(Column, XYContainerSerializer, { skipRegister: true });
  }
}