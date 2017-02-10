import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Renderable, RenderableInjector, ConfiguredRenderable, Transferable } from './dom';
import { Cancellable, Subject, Observable } from './events';
import { 
  ConfigurationRef, 
  ContainerRef, 
  RenderableArg  
} from './common';
import { Stack } from './Stack';
import { StackTab } from './StackTab';

export interface StackItemContainerConfig {
  use: RenderableArg<Renderable>;
  title?: string;
}

export class StackItemContainer extends Renderable implements Transferable {
  transferred: Observable<this>;
  
  private _item: Renderable;
  private _transferred: Subject<this> = new Subject();
  protected _container: Stack;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackItemContainerConfig,
    @Inject(ContainerRef) _container: Stack
  ) {
    super(_container);

    this.transferred = this._transferred.asObservable();
    this._container = _container;
    
    this._container.beforeTabDestroy
      .takeUntil(this.destroyed)
      .subscribe(this._onTabDestroy.bind(this));
    
    this._item = RenderableInjector.fromRenderable(
      this._config.use, 
      [
        { provide: StackItemContainer, useValue: this },
        { provide: ContainerRef, useValue: this }
      ],
      this._injector
    )
      .get(ConfiguredRenderable);
  }

  get width(): number {
    return this._container.isHorizontal 
      ? this._container.width 
      : this._container.width - this._container.header.width;
  }

  get height(): number {
    return this._container.isHorizontal 
      ? this._container.height - this._container.header.height 
      : this._container.height;
  }

  get isActive(): boolean {
    return this._container.isActiveContainer(this);
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
    super.makeVisible();
  }

  transferTo(container: Stack): void {
    this._container = container;
    this._transferred.next(this);
  }

  getChildren(): Renderable[] {
    return [ this._item ];
  }

  private _onTabDestroy(e: Cancellable<StackTab>): void {
    this._beforeDestroy.next(e);
  }
}