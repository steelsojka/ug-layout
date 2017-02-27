import { ConfiguredRenderable } from '../dom';
import { Inject } from '../di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from '../serialization';
import { Stack } from './Stack';
import { StackTab } from './StackTab';
import { StackHeaderConfig } from './StackHeader';
import { StackControl, MinimizeStackControl, CloseStackControl, StackControlSerializer } from './controls'
import { TabControl, CloseTabControl } from './tabControls'
import { XYDirection } from '../common';

export interface SerializedStackItem {
  use: Serialized;
  title: string;
  droppable: boolean;
  draggable: boolean;
  closeable: boolean;
  tabControls: Serialized[];
}

export interface SerializedStack extends Serialized {
  children: SerializedStackItem[];
  startIndex: number;
  direction: XYDirection;
  reverse: boolean;
  header: StackHeaderConfig|null;
  controls: Serialized[];
}

export class StackSerializer implements Serializer<Stack, SerializedStack> {
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  serialize(node: Stack): SerializedStack {
    return {
      name: 'Stack',
      startIndex: node.activeIndex,
      direction: node.direction,
      reverse: node.isReversed,
      header: !node.header ? null : {
        size: node.header.size,
        droppable: node.header.droppable,
        distribute: node.header.isDistributed
      },
      controls: !node.header ? [] : node.header.controls.map(control => {
        return this._container.serialize(control);
      }),
      children: node.items.map(item => {
        return {
          use: this._container.serialize(item.getChildren()[0]),
          title: item.title,
          draggable: item.draggable,
          droppable: item.droppable,
          closeable: item.closeable,
          tabControls: item.controls.map(control => {
            return this._container.serialize(control);
          })
        };
      })
    }  
  }

  deserialize(node: SerializedStack): ConfiguredRenderable<Stack> {
    return Stack.configure({
      startIndex: node.startIndex,
      direction: node.direction,
      reverse: node.reverse,
      header: !node.header ? {} : {
        size: node.header.size,
        droppable: node.header.droppable,
        distribute: node.header.distribute
      },
      controls: node.controls.map(control => {
        return this._container.deserialize<StackControl, Serialized>(control);
      }),
      children: node.children.map(child => {
        return {
          title: child.title,
          draggable: child.draggable,
          droppable: child.droppable,
          closeable: child.closeable,
          use: this._container.deserialize(child.use),
          tabControls: child.tabControls.map(tabCtrl => {
            return this._container.deserialize<TabControl, Serialized>(tabCtrl);
          })
        };
      })
    })
  }

  static register(container: SerializerContainer): void {
    container.registerClass('Stack', Stack);  
    container.registerSerializer(MinimizeStackControl, new StackControlSerializer('MinimizeStackControl', MinimizeStackControl));
    container.registerSerializer(CloseStackControl, new StackControlSerializer('CloseStackControl', CloseStackControl));
    container.registerSerializer(CloseTabControl, new GenericSerializer('CloseTabControl', CloseTabControl));
  }
}