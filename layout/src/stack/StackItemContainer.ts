import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di'
import { Renderer, Renderable, RenderableInjector, ConfiguredRenderable, RenderableArea } from '../dom';
import { BeforeDestroyEvent, Cancellable, Subject, Observable } from '../events';
import { MakeVisibleCommand } from '../commands';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RenderableArg,
  DropTarget,
  DropArea,
  DragEvent,
  HighlightCoordinateArgs
} from '../common';
import { Stack } from './Stack';
import { StackTab } from './StackTab';
import { StackItemCloseEvent } from './StackItemCloseEvent';
import { XYContainer } from '../XYContainer';
import { Row } from '../Row';
import { Column } from '../Column';

export interface StackItemContainerConfig {
  use: RenderableArg<Renderable>;
  title?: string;
}

export enum StackRegion {
  NORTH,
  SOUTH,
  EAST,
  WEST
}

export class StackItemContainer extends Renderable implements DropTarget {
  transferred: Observable<this>;
  
  private _item: Renderable;
  private _transferred: Subject<this> = new Subject();
  protected _container: Stack;
  
  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackItemContainerConfig,
    @Inject(ContainerRef) _container: Stack,
    @Inject(Renderer) private _renderer: Renderer
  ) {
    super(_injector);

    this.transferred = this._transferred.asObservable();
    this._container = _container;
    
    this._item = RenderableInjector.fromRenderable(
      this._config.use, 
      [
        { provide: StackItemContainer, useValue: this },
        { provide: ContainerRef, useValue: this }
      ],
      this._injector
    )
      .get(ConfiguredRenderable);

    this.subscribe(MakeVisibleCommand, this.makeVisible.bind(this));
  }

  get width(): number {
    return this._container.isHorizontal 
      ? this._container.width 
      : Math.max(this._container.width - this._container.header.width, 0);
  }

  get height(): number {
    return this._container.isHorizontal 
      ? Math.max(this._container.height - this._container.header.height, 0)
      : this._container.height;
  }

  get isActive(): boolean {
    return this._container.isActiveContainer(this);
  }

  get offsetY(): number {
    if (this._container.isHorizontal) {
      if (!this._container.isReversed) {
        return this._container.offsetY + this._container.header.height
      }
    }
    
    return this._container.offsetX;
  }

  get title(): string {
    return (this._config && this._config.title) || '';
  }

  get offsetX(): number {
    if (!this._container.isHorizontal) {
      if (!this._container.isReversed) {
        return this._container.offsetX + this._container.header.width
      }
    }
    
    return this._container.offsetX;
  }

  render(): VNode {
    return h('div.ug-layout__stack-item-container', {
      key: this._uid,
      props: {
        hidden: !this.isActive
      },
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, [ this._item.render() ]);
  }

  destroy(): void {
    this._transferred.complete();
    this._item.destroy();
    super.destroy();
  }

  isVisible(): boolean {
    return this._container.isVisible() && this._container.isActiveContainer(this);
  }

  makeVisible(): void {
    this._container.setActiveContainer(this);
  }

  getChildren(): Renderable[] {
    return [ this._item ];
  }

  handleDrop(item: StackItemContainer, dropArea: DropArea, e: DragEvent<Renderable>): void {
    const region = this._getRegionFromArea(e.pageX, e.pageY, dropArea.area);
    let Container = region === StackRegion.WEST || region === StackRegion.EAST ? Row : Column;
    let index = region === StackRegion.WEST || region === StackRegion.NORTH ? 1 : 0;

    const container = Injector.fromInjectable(
      Container, 
      [
        { provide: ContainerRef, useValue: this },
        Container
      ], 
      this._injector
    )
      .get(Container) as XYContainer;

    const newStack = Injector.fromInjectable(
      Stack, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: { children: [] } },
        Stack
      ], 
      this._injector
    )
      .get(Stack) as Stack;

    newStack.addChild(item);
    
    const existing = container.createChild({ use: this._item });
    const dropped = container.createChild({ use: newStack });

    item.setContainer(newStack);
    this._item.setContainer(existing);

    container.addChild(dropped, { index });
    container.addChild(existing, { index: index ? 1 : 0 });
    
    this._item = container;

    this.resize();
    this._renderer.render();
  }

  handleDropCleanup(): void {
    // this._container.removeContainer(this, { destroy: false });
  }

  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea {
    const { pageX, pageY, dropArea: { area: { x, x2, y, y2 } } } = args
    const highlightArea = new RenderableArea(x, x2, y, y2);
    const region = this._getRegionFromArea(pageX, pageY, args.dropArea.area);

    switch (region) {
      case StackRegion.WEST:
        highlightArea.x2 = (this.width / 2) + x;
        break;
      case StackRegion.EAST:
        highlightArea.x = (this.width / 2) + x;  
        break;
      case StackRegion.NORTH:
        highlightArea.y2 = (this.height / 2) + y;
        break;
      case StackRegion.SOUTH:
        highlightArea.y = (this.height / 2) + y;
        break;
    }

    return highlightArea;
  }

  isDroppable(): boolean {
    return true;
  }

  onDropHighlightExit(): void {}

  setContainer(container: Stack): void {
    if (container === this._container) {
      return;
    }
    
    super.setContainer(container);

    this._container.scope(StackItemCloseEvent)
      .filter(e => e.target === this)
      .takeUntil(this.containerChange)
      .subscribe(this._onTabClose.bind(this));
  }

  private _getRegionFromArea(pageX: number, pageY: number, area: RenderableArea): StackRegion|null {
    const { x, x2, y, y2 } = area;
    const deltaX = pageX - x;
    const deltaY = pageY - y;
    
    if (deltaX < this.width / 3) {
      return StackRegion.WEST;
    } else if (deltaX > (this.width / 3) * 2) {
      return StackRegion.EAST;
    } else if (deltaY < this.height / 2) {
      return StackRegion.NORTH;
    } else if (deltaY >= this.height / 2) {
      return StackRegion.SOUTH;
    }

    return null;
  }

  private _onTabClose(e: StackItemCloseEvent): void {
    this.emitDown(e.delegate(BeforeDestroyEvent, this));
  }
}