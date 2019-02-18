import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import { filter, takeUntil, first } from 'rxjs/operators';

import { Inject, PostConstruct } from '../di'
import { TabSelectionEvent } from './TabSelectionEvent';
import { Renderable, MemoizeFrom, RenderableConfig, RenderableDestroyContext } from '../dom';
import { Draggable } from '../Draggable';
import { ConfigurationRef, DocumentRef, DragEvent, ContextType } from '../common';
import { StackHeader } from './StackHeader';
import { TabDragEvent } from './TabDragEvent';
import { Stack } from './Stack';
import { StackItemContainer } from './StackItemContainer';
import { DragHost } from '../DragHost';
import { get } from '../utils';
import { TabControl } from './tabControls';
import { LockState, LOCK_DRAGGING } from '../LockState';
import { Layout } from '../layout';

export interface StackTabConfig extends RenderableConfig {
  maxSize: number;
  title: string;
}

export type StackTabConfigArgs = {
  [P in keyof StackTabConfig]?: StackTabConfig[P];
}

/**
 * Renderable representing a stack tab.
 * @export
 * @class StackTab
 * @extends {Renderable}
 */
export class StackTab extends Renderable {
  private _element: HTMLElement;
  private _isDragging: boolean = false;
  protected _container: StackHeader;

  @Inject(Draggable) private _draggable: Draggable<StackTab>;
  @Inject(DragHost) private _dragHost: DragHost;
  @Inject(DocumentRef) private _document: Document;
  @Inject(LockState) private _lockState: LockState;
  @Inject(ConfigurationRef) protected _config: StackTabConfig;

  get width(): number {
    return this._container.isHorizontal ? this._width : this._container.width;
  }

  get height(): number {
    return this._container.isHorizontal ? this._container.height : this._height;
  }

  /**
   * The HTML element for this tab.
   * @readonly
   * @type {HTMLElement}
   */
  get element(): HTMLElement {
    return this._element;
  }

  /**
   * The StackItemContainer associated with this tab.
   * @see {@link StackItemContainer}
   * @readonly
   * @type {(StackItemContainer|null)}
   */
  get item(): StackItemContainer|null {
    return this._container.getItemFromTab(this);
  }

  get offsetX(): number {
    return this._container.getOffsetXForTab(this);
  }

  get offsetY(): number {
    return this._container.getOffsetYForTab(this);
  }

  /**
   * Whether this tab is dragging.
   * @readonly
   * @type {boolean}
   */
  get isDragging(): boolean {
    return this._isDragging;
  }

  /**
   * The stack that this tab belongs to.
   * @readonly
   * @type {(Stack|null)}
   */
  get stack(): Stack|null {
    return (this._container ? this._container.container : null) as Stack|null;
  }

  /**
   * The list of tab controls.
   * @readonly
   * @type {TabControl[]}
   */
  get controls(): TabControl[] {
    const { item } = this;

    return item ? item.controls : [];
  }

  get isDraggable(): boolean {
    const { item } = this;
    const layout = this.getParent(Layout);

    // Only exclude the header from the drop target if this is the only tab.
    const excludes = this._container.length <= 1 ? [ this._container ] : [];

    if (this._lockState.get(LOCK_DRAGGING) || !item || !item.draggable
      || (layout && !layout.getDropTargets(item, { excludes }).length)
    ) {
      return false;
    }

    return true;
  }

  private get _resizeHashId(): string {
    return [
      get(this.item, 'title'),
      this._element ? 1 : 0,
      this.controls.map(c => c.isActive() ? c.uid : '').join('')
    ].join(':');
  }

  @PostConstruct()
  initialize(): void {
    this._config = Object.assign({
      maxSize: 150,
      title: ''
    }, this._config || {});

    super.initialize();

    this._draggable.drag
      .pipe(filter(Draggable.isDraggingEvent))
      .subscribe(this._onDragMove.bind(this));

    this._draggable.drag
      .pipe(filter(Draggable.isDragStopEvent))
      .subscribe(this._onDragStop.bind(this));

    this._draggable.drag
      .pipe(filter(Draggable.isDragStartEvent))
      .subscribe(this._onDragStart.bind(this));

    this._dragHost.start
      .pipe(takeUntil(this.destroyed))
      .subscribe(this._onDragHostStart.bind(this));

    this._dragHost.dropped
      .pipe(takeUntil(this.destroyed))
      .subscribe(this._onDragHostDropped.bind(this));
  }

  @MemoizeFrom('_resizeHashId')
  resize(): void {
    if (this._element) {
      const rect = this._element.getBoundingClientRect();

      this._width = rect.width;
      this._height = rect.height;
    }
  }

  render(): VNode {
    const { item } = this;
    const title = get(item, 'title', '');

    return h(`div.ug-layout__stack-tab`, {
      key: this.uid,
      style: this._getStyles(),
      attrs: { title },
      class: {
        'ug-layout__stack-tab-active': this._container.isTabActive(this),
        'ug-layout__stack-tab-distributed': this._container.isDistributed,
        'ug-layout__stack-tab-x': this._container.isHorizontal,
        'ug-layout__stack-tab-y': !this._container.isHorizontal,
        'ug-layout__stack-tab-draggable': this.isDraggable
      },
      hook: {
        create: (oldNode, newNode) => this._element = newNode.elm as HTMLElement,
        insert: () => this.resize()
      },
      on: {
        mousedown: e => this._onMouseDown(e),
        click: () => this._onClick()
      }
    }, [
      h('div', title),
      h('div.ug-layout__stack-tab-controls', this.controls.filter(c => c.isActive()).map(c => c.render()))
    ]);
  }

  isRenderable(): boolean {
    const item = this.item;

    return !item || item.isRenderable();
  }

  destroy(context: RenderableDestroyContext): void {
    this._draggable.destroy();
    super.destroy(context);
  }

  private _getStyles(): { [key: string]: string } {
    let result = {};

    if (this._container.isHorizontal) {
      if (!this._container.isDistributed) {
        result['max-width'] = `${this._config.maxSize}px`;
      }

      result['max-height'] = `${this._container.height}px`;
      result['height'] = `${this.height}px`;
    } else {
      if (!this._container.isDistributed) {
        result['max-height'] = `${this._config.maxSize}px`;
      }

      result['max-width'] = `${this._container.width}px`;
      result['width'] = `${this.width}px`;
    }

    return result;
  }

  private _onMouseDown(e: MouseEvent): void {
    if (!this.isDraggable) {
      return;
    }

    this._draggable.startDrag({
      host: this,
      startX: e.pageX,
      startY: e.pageY
    });
  }

  private _onDragStart(e: DragEvent<StackTab>): void {
    const item = this._container.getItemFromTab(this);
    const originStack = this.stack;
    const originIndex = this._container.getIndexOf(this);

    this._isDragging = true;
    this.emit(new TabDragEvent(this));
    this._element.classList.add('ug-layout__tab-dragging');
    this._document.body.appendChild(this._element);

    if (item) {
      this._dragHost.initialize({
        item: <Renderable>item,
        draggable: this._draggable,
        dragArea: this.getArea()
      });

      this._dragHost.fail.pipe(
        takeUntil(this._dragHost.dropped)
      )
        .subscribe(() => {
          if (originStack) {
            originStack.addChild(item, { index: originIndex });
          }
        });

      this._dragHost.dropped.pipe(first())
        .subscribe(() => this.destroy({ type: ContextType.NONE }));
    }
  }

  private _onDragMove(e: DragEvent<StackTab>): void {
    const { bounds } = this._dragHost;

    let x = e.pageX - (this.width / 2);
    let y = e.pageY - (this.height / 2);

    if (bounds) {
      x = bounds.clampX(x);
      y = bounds.clampY(y);
    }

    this._element.style.transform = `translateX(${x}px) translateY(${y}px)`;
  }

  private _onDragStop(e: DragEvent<StackTab>): void {
    this._isDragging = false;
    this._element.style.transform = `translateX(0px) translateY(0px)`;
    this._element.classList.remove('ug-layout__tab-dragging');
    this._document.body.removeChild(this._element);
  }

  private _onDragHostStart(): void {
    this._element.classList.add('ug-layout__tab-drag-enabled');
  }

  private _onDragHostDropped(): void {
    this._element.classList.remove('ug-layout__tab-drag-enabled');
  }

  private _onClick(): void {
    this.emit(new TabSelectionEvent(this));
  }
}