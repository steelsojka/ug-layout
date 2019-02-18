import h from 'snabbdom/h';
import { VNode } from 'snabbdom/vnode';

import { Inject, Injectable, PostConstruct } from '../di';
import {
  Renderable,
  ConfiguredRenderable,
  RenderableArea,
  RenderableConfig,
  RenderableDestroyContext
} from '../dom';
import {
  ContainerRef,
  ConfigurationRef,
  RenderableArg,
  DropArea
} from '../common';
import { DragHost, DragHostContainer } from '../DragHost';

export interface LayoutConfig extends RenderableConfig {
  child: RenderableArg<Renderable>;
}

/**
 * A layout is a set of renderables scoped to a drag host.
 * @export
 * @class Layout
 * @extends {Renderable}
 */
@Injectable({
  providers: [ DragHost ]
})
export class Layout extends Renderable {
  @Inject(ConfigurationRef) protected _config: LayoutConfig|null;
  @Inject(ContainerRef) protected _container: Renderable;
  @Inject(DragHost) protected _dragHost: DragHost;

  /**
   * The height of the layout in pixels.
   * @readonly
   * @type {number}
   */
  get height(): number {
    return this._container.height;
  }

  /**
   * The width of the layout in pixels.
   * @readonly
   * @type {number}
   */
  get width(): number {
    return this._container.width;
  }

  @PostConstruct()
  initialize(): void {
    super.initialize();

    if (!this._config || !this._config.child) {
      throw new Error('A layout requires a child renderable.');
    }

    this._contentItems.push(this.createChild(this._config.child));
    this._dragHost.start.subscribe(this._onDragHostStart.bind(this));
  }

  /**
   * Creates this renderables virtual node.
   * @returns {VNode}
   */
  render(): VNode {
    return h('div.ug-layout__layout', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    },
      this._contentItems.map(i => i.render())
    );
  }

  /**
   * Destroys this renderable.
   */
  destroy(context: RenderableDestroyContext): void {
    this._dragHost.destroy();
    super.destroy(context);
  }

  /**
   * Gets the visible areas of all descendant Renderables.
   * @returns {Array<{ item: Renderable, area: RenderableArea }>}
   */
  getItemVisibleAreas(): Array<{ item: Renderable, area: RenderableArea }> {
    return this.getDescendants()
      .filter(item => item.isVisible())
      .map(item => {
        return {
          item,
          area: item.getArea()
        };
      });
  }

  getDropTargets(target: Renderable, options: { excludes?: Renderable[] } = {}): DropArea[] {
    const { excludes = [] } = options;

    return this.getItemVisibleAreas()
      .filter(({ item }) => {
        return DragHost.isDropTarget(item)
          && item !== target
          && item.isDroppable(target)
          && !target.contains(item)
          && !target.isContainedWithin(item)
          && excludes.indexOf(item) === -1;
      }) as any;
  }

  isRenderable(): boolean {
    return this._contentItems.some(item => item.isRenderable());
  }

  private _onDragHostStart(container: DragHostContainer): void {
    const { offsetX, offsetY, height, width } = this;
    const { dragArea, item } = container;

    this._dragHost.bounds = new RenderableArea(offsetX, width + offsetX - dragArea.width, offsetY, height + offsetY - dragArea.height);
    this._dragHost.setDropAreas(this.getDropTargets(item));
  }

  /**
   * Configures a layout renderable.
   * @static
   * @param {LayoutConfig} config
   * @returns {ConfiguredRenderable<Layout>}
   */
  static configure(config: LayoutConfig): ConfiguredRenderable<Layout> {
    return new ConfiguredRenderable(Layout, config);
  }
}