import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di'
import { Renderable, RenderableInjector, ConfiguredRenderable, RenderableArea } from '../dom';
import { BeforeDestroyEvent, Cancellable, Subject, Observable } from '../events';
import { MakeVisibleCommand } from '../commands';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RenderableArg,
  DropTarget,
  DropArea
} from '../common';
import { Stack } from './Stack';
import { StackTab } from './StackTab';
import { StackItemCloseEvent } from './StackItemCloseEvent';

export interface StackItemContainerConfig {
  use: RenderableArg<Renderable>;
  title?: string;
}

export class StackItemContainer extends Renderable implements DropTarget {
  transferred: Observable<this>;
  
  private _item: Renderable;
  private _transferred: Subject<this> = new Subject();
  protected _container: Stack;
  
  constructor(
    @Inject(Injector) _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackItemContainerConfig,
    @Inject(ContainerRef) _container: Stack
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

  transferTo(container: Stack): void {
    this._container = container;
    this._transferred.next(this);
  }

  getChildren(): Renderable[] {
    return [ this._item ];
  }

  handleDrop(item: Renderable): void {
    // this._container.addChild(item);
  }

  handleDropCleanup(): void {
    this._container.removeContainer(this, { destroy: false });
  }

  getHighlightCoordinates(pageX: number, pageY: number, dropArea: DropArea): RenderableArea {
    let { x, x2, y, y2 } = dropArea.area;
    const deltaX = pageX - x;
    const deltaY = pageY - y;

    if (deltaX < this.width / 3) {
      x2 = this.width / 2;
    } else if (deltaX > (this.width / 3) * 2) {
      x = this.width / 2;  
    } else if (deltaY < this.height / 2) {
      y2 = this.height / 2;
    } else if (deltaY >= this.height / 2) {
      y = this.height / 2;
    }

    const height = y2 - y;
    const width = x2 - x;

    return {
      x, y, x2, y2, height, width,
      surface: height * width
    };
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

  private _onTabClose(e: StackItemCloseEvent): void {
    this.emitDown(e.delegate(BeforeDestroyEvent, this));
  }
}