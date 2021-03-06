import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import { filter, takeUntil, take } from 'rxjs/operators';

import { Inject, PostConstruct } from '../di';
import {
  Renderable,
  AddChildArgs,
  ConfiguredRenderable,
  RenderableArea,
  RenderableConfig,
  Transferable,
  RenderableDestroyContext
} from '../dom';
import { BeforeDestroyEvent } from '../events';
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
import { StackRegion } from './common';
import { get } from '../utils';
import { TabControl, CloseTabControl } from './tabControls';
import { DetachHandler, DetachLoc } from './DetachHandler';
import { RenderableStateChangeEvent } from '../events/RenderableStateChangeEvent';
import { DetachContainerRenderer } from './DetachContainerRenderer';

export interface StackItemContainerConfig extends RenderableConfig {
  use: RenderableArg<Renderable>;
  title?: string;
  droppable?: boolean;
  draggable?: boolean;
  closeable?: boolean;
  detachable?: boolean;
  detach?: {
    loc?: Partial<DetachLoc>;
    keepContainer: boolean;
    isDetached: boolean;
  };
  persist?: boolean;
  tabControls?: RenderableArg<TabControl>[];
}

/**
 * A renderable that is a direct child of a stack. Handles a renderable item.
 * @export
 * @class StackItemContainer
 * @extends {Renderable}
 * @implements {DropTarget}
 */
export class StackItemContainer extends Renderable
  implements DropTarget, Transferable {
  private _controls: TabControl[] = [];
  private _detachHandler: DetachHandler;

  @Inject(ConfigurationRef) protected _config: StackItemContainerConfig;
  @Inject(ContainerRef) protected _container: Stack;
  @Inject(DetachContainerRenderer)
  protected _detachContainerRenderer: DetachContainerRenderer;

  get container(): Stack {
    return this._container as Stack;
  }

  get controls(): TabControl[] {
    return [...this._controls];
  }

  get tab(): StackTab | null {
    return this._container.getTabAtIndex(this._container.getIndexOf(this));
  }

  get width(): number {
    return this.container.isHorizontal
      ? this.container.width
      : Math.max(this.container.width - this.container.header.width, 0);
  }

  get height(): number {
    return this.container.isHorizontal
      ? Math.max(this.container.height - this.container.header.height, 0)
      : this.container.height;
  }

  get isActive(): boolean {
    return this.container.isActiveContainer(this);
  }

  get offsetY(): number {
    if (this.container.isHorizontal) {
      if (!this.container.isReversed) {
        return this.container.offsetY + this.container.header.height;
      }
    }

    return this.container.offsetY;
  }

  get draggable(): boolean {
    return Boolean(get(this._config, 'draggable', true));
  }

  get droppable(): boolean {
    return Boolean(get(this._config, 'droppable', true));
  }

  get closeable(): boolean {
    return Boolean(get(this._config, 'closeable', false));
  }

  get detachable(): boolean {
    return Boolean(get(this._config, 'detachable', false));
  }

  get title(): string {
    return (this._config && this._config.title) || '';
  }

  get offsetX(): number {
    if (!this.container.isHorizontal) {
      if (!this.container.isReversed) {
        return this.container.offsetX + this.container.header.width;
      }
    }

    return this.container.offsetX;
  }

  get persist(): boolean {
    return this._config ? this._config.persist !== false : true;
  }

  get isDetachable(): boolean {
    return this._config.detachable === true && !this._detachHandler.isDetached;
  }

  get keepContainerOnDetach(): boolean {
    return Boolean(get(this._config.detach, 'keepContainer', false));
  }

  protected get _item(): Renderable {
    return this._contentItems[0];
  }

  @PostConstruct()
  initialize(): void {
    super.initialize();

    this._detachHandler = this._injector.resolveAndInstantiate(DetachHandler);

    this._contentItems = [this.createChild(this._config.use)];

    this._config.tabControls = this._config.tabControls || [];

    if (
      !ConfiguredRenderable.inList(this._config.tabControls, CloseTabControl)
    ) {
      this._config.tabControls.push(CloseTabControl);
    }

    for (const control of this._config.tabControls) {
      this.addControl(control, { resize: false, render: false });
    }

    this.subscribe(MakeVisibleCommand, this.makeVisible.bind(this));
    this._detachHandler.onClose.subscribe(() => {
      this.emitUp(new RenderableStateChangeEvent(this));
      this._renderer.render();
    });
    this._detachHandler.onResize.subscribe(() => this._renderer.render());

    if (this._config.detach && this._config.detach.isDetached) {
      this._renderer.rendered
        .pipe(take(1))
        .subscribe(() => this.detach(this._config.detach!.loc));
    }
  }

  render(): VNode {
    if (this._detachHandler.isDetached) {
      this._detachHandler.render(
        h(
          'div.ug-layout__stack-item-container',
          {
            key: this._uid,
            style: {
              height: `${this._detachHandler.height}px`,
              width: `${this._detachHandler.width}px`
            }
          },
          [this._item.render()]
        )
      );
    }

    return h(
      'div.ug-layout__stack-item-container',
      {
        key: this._uid,
        props: {
          hidden: !this.isActive
        },
        style: {
          height: `${this.height}px`,
          width: `${this.width}px`
        }
      },
      [
        this._detachHandler.isDetached
          ? this._detachContainerRenderer.render(this)
          : this._item.render()
      ]
    );
  }

  isVisible(): boolean {
    return (
      this.container.isVisible() && this._container.isActiveContainer(this)
    );
  }

  makeVisible(): void {
    this._container.setActiveContainer(this);
    this._detachHandler.focus();
  }

  getChildren(): Renderable[] {
    return [this._item];
  }

  handleDrop(
    item: StackItemContainer,
    dropArea: DropArea,
    e: DragEvent<Renderable>
  ): void {
    const region = this._getRegionFromArea(e.pageX, e.pageY, dropArea.area);
    this._container.handleItemDrop(region as StackRegion, item);
    this._renderer.render();
  }

  getHighlightCoordinates(args: HighlightCoordinateArgs): RenderableArea {
    const {
      pageX,
      pageY,
      dropArea: {
        area: { x, x2, y, y2 }
      }
    } = args;
    const highlightArea = new RenderableArea(x, x2, y, y2);
    const region = this._getRegionFromArea(pageX, pageY, args.dropArea.area);

    switch (region) {
      case StackRegion.WEST:
        highlightArea.x2 = this.width / 2 + x;
        break;
      case StackRegion.EAST:
        highlightArea.x = this.width / 2 + x;
        break;
      case StackRegion.NORTH:
        highlightArea.y2 = this.height / 2 + y;
        break;
      case StackRegion.SOUTH:
        highlightArea.y = this.height / 2 + y;
        break;
    }

    return highlightArea;
  }

  isDroppable(): boolean {
    return this.droppable;
  }

  onDropHighlightExit(): void {}

  getTransferableConfig(to: Renderable): { [key: string]: any } {
    if (to instanceof XYContainer) {
      return { persist: this._config.persist };
    }

    return {};
  }

  addControl(
    control: RenderableArg<TabControl>,
    options: AddChildArgs = {}
  ): void {
    const { index = -1, render = true, resize = true } = options;
    const { tab } = this;

    const newControl = this.createChild(control);

    if (index !== -1) {
      this._controls.splice(index, 0, newControl);
    } else {
      this._controls.push(newControl);
    }

    if (tab && resize) {
      tab.resize();
    }

    if (render) {
      this._renderer.render();
    }
  }

  setContainer(container: Stack): void {
    super.setContainer(container);

    this._container
      .scope(StackItemCloseEvent)
      .pipe(
        filter(e => e.target === this),
        takeUntil(this.containerChange)
      )
      .subscribe(this._onTabClose.bind(this));
  }

  detach(loc?: Partial<DetachLoc>): void {
    const isActive = this.isActive;
    const index = this.container.getIndexOf(this);

    this._detachHandler.detach(loc).then(didDetach => {
      if (didDetach) {
        if (isActive && !this.keepContainerOnDetach) {
          this.container.setActiveIndex(index === 0 ? 1 : index - 1, {
            render: false
          });
        }

        this.emitUp(new RenderableStateChangeEvent(this));
        this._renderer.render();
      }
    });
  }

  destroy(context: RenderableDestroyContext): void {
    super.destroy(context);

    this._detachHandler.destroy();
  }

  getWidthForChild(): number {
    return this._detachHandler.isDetached
      ? this._detachHandler.width
      : super.getWidthForChild();
  }

  getHeightForChild(): number {
    return this._detachHandler.isDetached
      ? this._detachHandler.height
      : super.getHeightForChild();
  }

  isRenderable(): boolean {
    return !this._detachHandler.isDetached || this.keepContainerOnDetach;
  }

  isDetached(): boolean {
    return this._detachHandler.isDetached;
  }

  getActiveWindow(): Window | null {
    return this._detachHandler.isDetached
      ? this._detachHandler.getChild()
      : super.getActiveWindow();
  }

  getLoc(): Partial<DetachLoc> {
    return this._detachHandler.getLoc();
  }

  private _getRegionFromArea(
    pageX: number,
    pageY: number,
    area: RenderableArea
  ): StackRegion | null {
    const { x, y } = area;
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

  static configure(
    config: StackItemContainerConfig
  ): ConfiguredRenderable<StackItemContainer> {
    return new ConfiguredRenderable(StackItemContainer, config);
  }
}
