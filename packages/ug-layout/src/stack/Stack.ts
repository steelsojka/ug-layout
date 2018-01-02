import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, Inject, PostConstruct } from '../di';
import {
  Renderable,
  RemoveChildArgs,
  AddChildArgs,
  ConfiguredRenderable,
  BaseModificationArgs,
  RenderableDestroyContext
} from '../dom';
import { BeforeDestroyEvent } from '../events';
import {
  ConfigurationRef,
  ContainerRef,
  RenderableArg,
  XYDirection,
  ContextType
} from '../common';
import {
  XYItemContainer,
  Row,
  Column,
  ROW_CLASS,
  COLUMN_CLASS
} from '../XYContainer';
import { StackHeader, StackHeaderConfigArgs } from './StackHeader';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { TabDragEvent } from './TabDragEvent';
import { StackItemCloseEvent } from './StackItemCloseEvent';
import { StackItemContainer, StackItemContainerConfig } from './StackItemContainer';
import { StackTab } from './StackTab';
import { clamp, get, isNumber, propEq } from '../utils';
import { StackRegion, STACK_HEADER_CLASS, STACK_ITEM_CONTAINER_CLASS } from './common';
import { RenderableConfigArgs, RenderableConfig } from '../dom';
import { StackControl, CloseStackControl } from './controls';

export interface StackConfig extends RenderableConfig {
  children: StackItemContainerConfig[];
  startIndex: number;
  direction: XYDirection;
  reverse: boolean;
  header: StackHeaderConfigArgs|null;
  controls: RenderableArg<StackControl>[];
}

export interface StackConfigArgs extends RenderableConfigArgs {
  children: StackItemContainerConfig[];
  startIndex?: number;
  direction?: XYDirection;
  reverse?: boolean;
  header?: StackHeaderConfigArgs;
  controls?: RenderableArg<StackControl>[];
}

/**
 * A Renderable that renders the Renderable items in a tabbable format.
 * @export
 * @class Stack
 * @extends {Renderable}
 */
export class Stack extends Renderable {
  private _header: StackHeader;
  private _activeIndex: number = 0;
  protected _contentItems: StackItemContainer[] = [];

  @Inject(ConfigurationRef) protected _config: StackConfig;
  @Inject(ContainerRef) protected _container: Renderable;
  @Inject(STACK_HEADER_CLASS) protected _StackHeader: typeof StackHeader;
  @Inject(STACK_ITEM_CONTAINER_CLASS) protected _StackItemContainer: typeof StackItemContainer;
  @Inject(ROW_CLASS) protected _Row: typeof Row;
  @Inject(COLUMN_CLASS) protected _Column: typeof Column;

  /**
   * The direction of the stack.
   * @readonly
   * @type {XYDirection}
   */
  get direction(): XYDirection {
    return this._config && this._config.direction != null ? this._config.direction : XYDirection.X;
  }

  /**
   * Whether the stack is horizontal.
   * @readonly
   * @type {boolean}
   */
  get isHorizontal(): boolean {
    return this.direction === XYDirection.X;
  }

  /**
   * Whether the stack is reversed
   * @readonly
   * @type {boolean}
   */
  get isReversed(): boolean {
    return Boolean(this._config.reverse === true);
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  /**
   * Whether this stack is considered closable.
   * @readonly
   * @type {boolean}
   */
  get isCloseable(): boolean {
    return this._contentItems.every(propEq('closeable', true));
  }

  /**
   * The active content item index.
   * @readonly
   * @type {number}
   */
  get activeIndex(): number {
    return this._activeIndex;
  }

  /**
   * The header associated with this stack.
   * @readonly
   * @type {StackHeader}
   */
  get header(): StackHeader {
    return this._header;
  }

  /**
   * Gets the content items.
   * @readonly
   * @type {StackItemContainer[]}
   */
  get items(): StackItemContainer[] {
    return this._contentItems;
  }

  /**
   * @listens {TabCloseEvent}
   * @listens {TabSelectionEvent}
   * @listens {TabDragEvent}
   */
  @PostConstruct()
  initialize(): void {
    this._config = Object.assign({
      controls: [],
      header: null,
      children: [],
      startIndex: 0,
      direction: XYDirection.X,
      reverse: false
    }, this._config);

    super.initialize();

    this._header = this.createChild(new ConfiguredRenderable(this._StackHeader, this._config ? this._config.header : null));
    this._header.subscribe(TabCloseEvent, this._onTabClose.bind(this));
    this._header.subscribe(TabSelectionEvent, this._onTabSelect.bind(this));
    this._header.subscribe(TabDragEvent, this._onTabDrag.bind(this));

    this._config.children.forEach(child => {
      this.addChild(this.createChildItem(child), { render: false, resize: false });
    });

    if (!ConfiguredRenderable.inList(this._config.controls, CloseStackControl)) {
      this._config.controls.push(CloseStackControl);
    }

    this._config.controls.forEach(control => this.addControl(control));
    this._setActiveIndex(this._config.startIndex);
  }

  render(): VNode {
    return h(`div.ug-layout__stack`, {
      key: this.uid,
      class: {
        'ug-layout__stack-y': !this.isHorizontal,
        'ug-layout__stack-reverse': this.isReversed
      }
    }, [
      this._header.render(),
      ...this._contentItems.map(item => item.render())
    ]);
  }

  /**
   * Creates a child {@link StackItemContainer}.
   * @param {StackItemContainerConfig} config
   * @returns {StackItemContainer}
   */
  createChildItem(config: StackItemContainerConfig): StackItemContainer {
    return this.createChild(new ConfiguredRenderable(this._StackItemContainer, config));
  }

  /**
   * Adds a header control to this stack.
   * @param {RenderableArg<StackControl>} control
   */
  addControl(control: RenderableArg<StackControl>): void {
    if (this._header) {
      this._header.addControl(control);
    }
  }

  /**
   * Adds a child renderable. If the renderable being added is not a StackItemContainer
   * then one is created and the item is wrapped in it.
   * @param {Renderable} item
   * @param {AddChildArgs} [options={}]
   */
  addChild(item: Renderable, options: AddChildArgs = {}): void {
    const { index } = options;
    let container: StackItemContainer;

    if (!(item instanceof StackItemContainer)) {
      container = this.createChildItem({ use: item });
    } else {
      container = item;
    }

    this._header.addTab({
      title: container.title,
      maxSize: get<number>(this._config, 'header.maxTabSize', 200),
    }, {
      index,
      render: false,
      resize: false
    });

    super.addChild(item, options);
  }

  /**
   * Removes a child item along with the tab associated with.
   * @param {StackItemContainer} item
   * @param {RemoveChildArgs} [options={}]
   * @returns {void}
   */
  removeChild(item: StackItemContainer, options: RemoveChildArgs = {}): void {
    const { render = true, context = ContextType.NONE } = options;
    const index = this._contentItems.indexOf(item);

    if (index === -1) {
      return;
    }

    const tab = this._header.getAtIndex(index);

    if (tab) {
      this._header.removeChild(tab, Object.assign({}, options, { render: false, context }));
    }

    super.removeChild(item, Object.assign({}, options, { render: false, context }));

    this._setActiveIndex(this._activeIndex);

    if (render) {
      this._renderer.render();
    }
  }

  /**
   * Sets the active item at a specific index.
   * @param {number} [index]
   * @param {BaseModificationArgs} [args={}]
   */
  setActiveIndex(index?: number, args: BaseModificationArgs = {}): void {
    const { render = true } = args;

    this._setActiveIndex(index);

    if (render) {
      this._renderer.render();
    }
  }

  /**
   * Removes an item a specified index.
   * @param {number} index
   * @param {RemoveChildArgs} [options={}]
   */
  removeAtIndex(index: number, options: RemoveChildArgs = {}): void {
    const item = this.getAtIndex(index);

    if (item) {
      this.removeChild(item as StackItemContainer, options);
    }
  }

  /**
   * Closes the stack if all items are closeable.
   * @emits {BeforeDestroyEvent} Event that can prevent this action.
   * @returns {void}
   */
  close(context: ContextType = ContextType.NONE): void {
    if (!this.isCloseable) {
      return;
    }

    const event = new BeforeDestroyEvent(this);

    this.emitDown(event);
    event.results().subscribe(() => {
      if (this._container) {
        this._container.removeChild(this, { context });
      } else {
        this.destroy({ type: context });
      }
    });
  }

  destroy(context: RenderableDestroyContext): void {
    this._header.destroy(context);
    super.destroy(context);
  }

  getChildren(): Renderable[] {
    return [
      ...this._contentItems,
      this._header
    ];
  }

  /**
   * Gets the index of a tab.
   * @param {StackTab} tab
   * @returns {number}
   */
  getIndexOfTab(tab: StackTab): number {
    return this._header.getIndexOf(tab);
  }

  /**
   * Determines whether an item is the action item container.
   * @param {StackItemContainer} container
   * @returns {boolean}
   */
  isActiveContainer(container: StackItemContainer): boolean {
    return this.getIndexOf(container) === this.activeIndex;
  }

  /**
   * Determines whether a tab is the active tab.
   * @param {StackTab} tab
   * @returns {boolean}
   */
  isActiveTab(tab: StackTab): boolean {
    return this._header.getIndexOf(tab) === this.activeIndex;
  }

  /**
   * Gets a tab at a specified index.
   * @param {number} index
   * @returns {(StackTab|null)}
   */
  getTabAtIndex(index: number): StackTab|null {
    return this._header.getAtIndex(index) as StackTab|null;
  }

  /**
   * Sets the given container as the active item.
   * @param {StackItemContainer} container
   */
  setActiveContainer(container: StackItemContainer): void {
    this.setActiveIndex(this.getIndexOf(container));
  }

  /**
   * Sets the active item from the given tab.
   * @param {StackTab} tab
   */
  setActiveTab(tab: StackTab): void {
    this.setActiveIndex(this.getIndexOfTab(tab));
  }

  getMinimizedSize(): number {
    return this._header.size;
  }

  /**
   * Gets the leaf nodes of the active item container.
   * @override
   * @returns {Renderable}
   */
  getLeafNodes(): Renderable[] {
    const item = this.getAtIndex(this.activeIndex);

    if (item) {
      return item.getLeafNodes();
    }

    return [ this ];
  }

  /**
   * Handles a renderable being dropped on the stack within a certain region.
   * @param {StackRegion} region The region the item was dropped in.
   * @param {Renderable} item The item being dropped.
   */
  handleItemDrop(region: StackRegion, item: Renderable): void {
    if (
      this._container instanceof XYItemContainer
      && (((region === StackRegion.EAST || region === StackRegion.WEST) && this._container.isRow)
        || ((region === StackRegion.NORTH || region === StackRegion.SOUTH) && !this._container.isRow))
    ) {
      // If this stack belongs to a Row/Column and the item is being dropped in a region that flows with that container
      // then it can be dropped in without creating the XYItemContainer.
      const containerIndex = this._container.container.getIndexOf(this._container);
      const index = region === StackRegion.NORTH || region === StackRegion.WEST
        ? containerIndex
        : containerIndex + 1;

      this._container.addChild(item, { index, render: false, resize: false });
      this._container.ratio = <number>this._container.ratio * 0.5;
      this._container.container.resize();
    } else {
      // Create a Row/Column and replace this stack with it, while adding the stack as an item.
      const container = this._createContainerFromRegion(region);
      const index = region === StackRegion.NORTH || region === StackRegion.WEST ? 0 : -1;

      this._container.replaceChild(this, container, { destroy: false, render: false });

      container.addChild(this, { render: false });
      container.addChild(item, { render: false, index });
    }

    this._renderer.render();
  }

  private _createContainerFromRegion(region: StackRegion): Row|Column {
    const RowOrColumn = this._getContainerDropType(region);

    return this.createChild<Row|Column>(new ConfiguredRenderable(RowOrColumn as Type<Row|Column>, {}), [
      { provide: ContainerRef, useValue: null }
    ]);
  }

  private _getContainerDropType(region: StackRegion): typeof Row|typeof Column {
    return region === StackRegion.EAST || region === StackRegion.WEST ? this._Row : this._Column;
  }

  private _onTabClose(e: TabCloseEvent): void {
    const container = this.getAtIndex(this.getIndexOfTab(e.target)) as StackItemContainer|null;

    if (container) {
      const event = e.delegate(StackItemCloseEvent, container);

      this._eventBus.next(event);

      event.results().subscribe(() => {
        this.removeChild(container);
      });
    }
  }

  private _onTabSelect(e: TabSelectionEvent): void {
    this.setActiveTab(e.target);
  }

  private _onTabDrag(e: TabDragEvent): void {
    const item = this.getAtIndex(this.getIndexOfTab(e.target)) as StackItemContainer|null;

    if (item) {
      this.removeChild(item, { destroy: false });
    }
  }

  private _setActiveIndex(index?: number): void {
    if (!isNumber(index)) {
      return;
    }

    this._activeIndex = clamp(index, 0, Math.max(this._contentItems.length - 1, 0));
  }

  static configure(config: StackConfigArgs): ConfiguredRenderable<Stack> {
    return new ConfiguredRenderable(Stack, config);
  }
}