import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { SerializerContainer, Serializer, Serialized } from '../serialization';
import { XYItemContainer } from './XYItemContainer'
import { Row } from './Row';
import { Column } from './Column';
import { UNALLOCATED, XYDirection } from '../common';
import { XY_ITEM_CONTAINER_CLASS } from './common';

export interface SerializedXYItemContainer {
  name: 'XYItemContainer';
  use: Serialized;
  tags: string[];
  ratio: number|null;
  initialSize?: number;
  minSizeX?: number;
  maxSizeX?: number;
  minSizeY?: number;
  maxSizeY?: number;
  fixed: boolean;
  minimized: boolean;
}

export class XYItemContainerSerializer extends Serializer<XYItemContainer, SerializedXYItemContainer> {
  serialize(node: XYItemContainer): SerializedXYItemContainer {
    return {
      name: 'XYItemContainer',
      use: this.container.serialize(node.item),
      tags: [ ...node.tags ],
      ratio: node.ratio === UNALLOCATED ? null : node.ratio as number,
      initialSize: node.initialSize ? node.initialSize : undefined,
      minimized: node.isMinimized,
      minSizeX: node.minSizeX,
      maxSizeX: node.maxSizeX === Number.MAX_SAFE_INTEGER ? undefined : node.maxSizeX,
      minSizeY: node.minSizeY,
      maxSizeY: node.maxSizeY === Number.MAX_SAFE_INTEGER ? undefined : node.maxSizeY,
      fixed: node.fixed
    };    
  }

  deserialize(node: SerializedXYItemContainer): ConfiguredRenderable<XYItemContainer> {
    return XYItemContainer.configure({
      use: this.container.deserialize(node.use),
      ratio: node.ratio == null ? undefined : node.ratio as number,
      tags: node.tags,
      initialSize: node.initialSize,
      minSizeX: node.minSizeX,
      maxSizeX: node.maxSizeX,
      minSizeY: node.minSizeY,
      maxSizeY: node.maxSizeY,
      minimized: node.minimized,
      fixed: node.fixed
    });
  }

  exclude(node: XYItemContainer): boolean {
    return !node.persist;
  }

  static register(container: SerializerContainer): void {
    container.registerClass('XYItemContainer', container.resolve<typeof XYItemContainer>(XY_ITEM_CONTAINER_CLASS, true));

    Serializer.register.call(this, container);
  }
}