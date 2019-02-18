import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from '../serialization';
import { Stack } from './Stack';
import { StackHeaderConfig } from './StackHeader';
import { StackControl, MinimizeStackControl, CloseStackControl, StackControlSerializer, DetachStackControl } from './controls'
import { TabControl, CloseTabControl } from './tabControls'
import { XYDirection } from '../common';
import {
  STACK_CLASS
} from './common';

export interface SerializedStackItem {
  tags: string[];
  use: Serialized;
  title: string;
  droppable: boolean;
  draggable: boolean;
  closeable: boolean;
  detachable: boolean;
  isDetached: boolean;
  tabControls: Serialized[];
  persist?: boolean;
}

export interface SerializedStack extends SerializedRenderable {
  children: SerializedStackItem[];
  startIndex: number;
  direction: XYDirection;
  reverse: boolean;
  header: StackHeaderConfig|null;
  controls: Serialized[];
  persist?: boolean;
}

export class StackSerializer extends Serializer<Stack, SerializedStack> {
  @Inject(STACK_CLASS) protected _Stack: typeof Stack;

  serialize(node: Stack): SerializedStack {
    return {
      name: 'Stack',
      tags: [ ...node.tags ],
      startIndex: node.activeIndex,
      direction: node.direction,
      reverse: node.isReversed,
      header: !node.header ? null : {
        size: node.header.size,
        droppable: node.header.droppable,
        distribute: node.header.isDistributed
      },
      controls: !node.header ? [] : node.header.controls.map(control => {
        return this.container.serialize(control);
      }),
      children: node.items
        .filter(item => item.persist)
        .map(item => {
          return {
            use: this.container.serialize(item.getChildren()[0]),
            tags: [ ...item.tags ],
            title: item.title,
            draggable: item.draggable,
            droppable: item.droppable,
            closeable: item.closeable,
            detachable: item.detachable,
            isDetached: item.isDetached(),
            tabControls: item.controls.map(control => {
              return this.container.serialize(control);
            })
          };
        })
    }
  }

  deserialize(node: SerializedStack): ConfiguredRenderable<Stack> {
    return this._Stack.configure({
      startIndex: node.startIndex,
      direction: node.direction,
      reverse: node.reverse,
      tags: node.tags,
      header: !node.header ? {} : {
        size: node.header.size,
        droppable: node.header.droppable,
        distribute: node.header.distribute
      },
      controls: node.controls.map(control => {
        return this.container.deserialize<StackControl, Serialized>(control);
      }),
      children: node.children.map(child => {
        return {
          tags: child.tags,
          title: child.title,
          draggable: child.draggable,
          droppable: child.droppable,
          closeable: child.closeable,
          detachable: child.detachable,
          use: this.container.deserialize(child.use),
          tabControls: child.tabControls.map(tabCtrl => {
            return this.container.deserialize<TabControl, Serialized>(tabCtrl);
          })
        };
      })
    })
  }

  static register(container: SerializerContainer): void {
    container.registerClass('Stack', container.resolve<typeof Stack>(STACK_CLASS, true));
    container.registerSerializer(MinimizeStackControl, StackControlSerializer.configure<MinimizeStackControl>({ name: 'MinimizeStackControl', type: MinimizeStackControl }));
    container.registerSerializer(CloseStackControl, StackControlSerializer.configure<CloseStackControl>({ name: 'CloseStackControl', type: CloseStackControl }));
    container.registerSerializer(CloseTabControl, GenericSerializer.configure({ name: 'CloseTabControl', type: CloseTabControl }));
    container.registerSerializer(DetachStackControl, GenericSerializer.configure<DetachStackControl>({ name: 'DetachControl', type: DetachStackControl }));

    Serializer.register.call(this, container);
  }
}