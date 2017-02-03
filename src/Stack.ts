import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di';
import { 
  RenderableInjector, 
  Renderable, 
  ConfiguredRenderable,
  Renderer
} from './dom';
import { ConfigurationRef, ContainerRef, RenderableArg, XYDirection } from './common';
import { XYItemContainer, XYItemContainerConfig } from './XYItemContainer';
import { StackHeader, StackHeaderConfigArgs } from './StackHeader';
import { StackItemContainer, StackItemContainerConfig } from './StackItemContainer';
import { StackTab } from './StackTab';
import { clamp, get } from './utils';

export interface StackConfig {
  children: StackItemContainerConfig[];
  startIndex?: number;
  direction?: XYDirection;
  reverse?: boolean;
  header?: StackHeaderConfigArgs;
}

export const DEFAULT_STACK_HEADER_SIZE = 25;

export class Stack implements Renderable {
  private _children: Array<{ tab: StackTab, item: StackItemContainer }> = [];
  private _direction: XYDirection;
  private _header: StackHeader;
  private _activeIndex: number = 0;
  
  constructor(
    @Inject(ContainerRef) private _container: Renderable,
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackConfig|null,
    @Inject(Renderer) private _renderer: Renderer
  ) {
    const headerConfig = {
      size: DEFAULT_STACK_HEADER_SIZE  
    };

    if (this._config && this._config.header) {
      Object.assign(headerConfig, this._config.header);
    }

    this._header = this._injector.spawn([
      { provide: ContainerRef, useValue: this },
      { provide: Stack, useValue: this },
      { provide: ConfigurationRef, useValue: headerConfig },
      StackHeader  
    ])
      .get(StackHeader);
    
    if (this._config) {
      this._config.children.forEach(child => this.addChild(child));
    }
  }

  get direction(): XYDirection {
    return this._config && this._config.direction != null ? this._config.direction : XYDirection.X;
  }

  get isHorizontal(): boolean {
    return this.direction === XYDirection.X;
  }

  get isReversed(): boolean {
    return Boolean(this._config && this._config.reverse === true);
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  get activeIndex(): number {
    return this._activeIndex;
  }

  get header(): StackHeader {
    return this._header;
  }

  render(): VNode {
    return h('div.ug-layout__stack', {}, [
      this._header.render(),
      ...this._children.map(child => child.item.render())  
    ]);
  }

  resize(): void {
    this._header.resize();

    for (const { item } of this._children) {
      item.resize();
    }
  }

  addChild(config: StackItemContainerConfig): void {
    const item = this._injector.spawn([
      { provide: ContainerRef, useValue: this },
      { provide: Stack, useValue: this },
      { provide: ConfigurationRef, useValue: config },
      StackItemContainer
    ])
      .get(StackItemContainer) as StackItemContainer

    const tab = this._header.addTab({
      maxWidth: get<number>(this._config, 'header.maxTabWidth', 200),
      title: config.title
    });

    this._children.push({ item, tab });
  }

  getIndexOfContainer(container: StackItemContainer): number {
    for (const [ index, { item } ] of this._children.entries()) {
      if (item === container) {
        return index;
      }
    }

    return -1;
  }

  isActiveContainer(container: StackItemContainer) {
    return this.getIndexOfContainer(container) === this.activeIndex;
  }

  setActive(container: StackItemContainer|number): void {
    let index;
    
    if (container instanceof StackItemContainer) {
      index = this.getIndexOfContainer(container);
    } else {
      index = container;
    }

    this._activeIndex = clamp(index, 0, this._children.length - 1);
    this._renderer.render();
  }

  static configure(config: StackConfig): ConfiguredRenderable<Stack> {
    return new ConfiguredRenderable(Stack, config);
  }
}