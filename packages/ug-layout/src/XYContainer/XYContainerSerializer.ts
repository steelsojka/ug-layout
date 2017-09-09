import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { SerializerContainer, Serializer, Serialized } from '../serialization';
import { XYContainer } from './XYContainer';
import { Row } from './Row';
import { Column } from './Column';
import { UNALLOCATED, XYDirection } from '../common';
import { XYItemContainer } from './XYItemContainer';
import { SerializedXYItemContainer } from './XYItemContainerSerializer';
import {
  ROW_CLASS,
  COLUMN_CLASS
} from './common';

export interface SerializedXYContainer extends SerializedRenderable {
  direction: XYDirection;
  static: boolean;
  splitterSize: number;
  children: SerializedXYItemContainer[];
}

export class XYContainerSerializer extends Serializer<XYContainer, SerializedXYContainer> {
  serialize(node: XYContainer): SerializedXYContainer {
    return {
      name: 'XYContainer',
      tags: [ ...node.tags ],
      static: node.isStatic,
      direction: node.direction,
      splitterSize: node.splitterSize,
      children: this.container.serializeList<XYItemContainer, SerializedXYItemContainer>(node.getChildren())
    };    
  }

  deserialize(node: SerializedXYContainer): ConfiguredRenderable<XYContainer> {
    const Ctor = node.direction === XYDirection.X ? Row : Column;
    
    return Ctor.configure({
      splitterSize: node.splitterSize,
      static: node.static,
      tags: node.tags,
      children: this.container.deserializeList<XYItemContainer, SerializedXYItemContainer>(node.children)
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('XYContainer', XYContainer);
    container.registerSerializer(container.resolve<typeof Row>(ROW_CLASS, true), XYContainerSerializer, { skipRegister: true });
    container.registerSerializer(container.resolve<typeof Column>(COLUMN_CLASS, true), XYContainerSerializer, { skipRegister: true });

    Serializer.register.call(this, container);
  }
}