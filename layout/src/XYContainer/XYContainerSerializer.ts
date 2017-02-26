import { ConfiguredRenderable } from '../dom';
import { Serializer, Serialized } from '../serialization';
import { XYContainer } from './XYContainer';
import { Row } from './Row';
import { Column } from './Column';
import { UNALLOCATED, XYDirection } from '../common';

export interface SerializedXYContainerItem {
  use: Serialized;
  ratio: number|null;
  minSizeX: number;
  maxSizeX: number;
  minSizeY: number;
  maxSizeY: number;
  fixed: boolean;
}

export interface SerializedXYContainer extends Serialized {
  name: 'XYContainer';
  direction: XYDirection;
  splitterSize: number;
  children: SerializedXYContainerItem[];
}

// TODO: Have an api that gets passed into these functions that can serialize
// and desserialze child nodes.

export class XYContainerSerializer implements Serializer<XYContainer, SerializedXYContainer> {
  serialize(node: XYContainer): SerializedXYContainer {
    return {
      name: 'XYContainer',
      direction: node.direction,
      splitterSize: node.splitterSize,
      children: node.getChildren().map(item => {
        return {
          use: { name: '' }, // TODO: Serialize child node here.
          ratio: item.ratio === UNALLOCATED ? null : item.ratio as number,
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
      children: node.children.map(child => {
        return {
          use: {} as any,  // TODO: Deserialize child here
          ratio: child.ratio == null ? undefined : child.ratio as number,
          minSizeX: child.minSizeX,
          maxSizeX: child.maxSizeX,
          minSizeY: child.minSizeY,
          maxSizeY: child.maxSizeY,
          fixed: child.fixed
        }; 
      })      
    });
  }
}