import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, ProviderArg, Inject, Injector, Optional, forwardRef } from '../di';
import { Renderer, Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef, ElementRef } from '../common';
import { Stack } from '../stack';
import { ViewContainer } from './ViewContainer';
import { ViewConfig } from './common';
import { Subject, Observable, BeforeDestroyEvent } from '../events';
import { MakeVisibleCommand, MinimizeCommand } from '../commands';
import { ViewManager } from './ViewManager';

export class View extends Renderable {
  visibilityChanges: Observable<boolean>;
  sizeChanges: Observable<{ width: number, height: number }>;
  
  private _viewContainer: ViewContainer<any>;
  private _element: HTMLElement;
  private _visiblityChanges: Subject<boolean> = new Subject();
  private _sizeChanges: Subject<{ width: number, height: number }> = new Subject();
  
  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(Injector) protected _injector: Injector,
    @Inject(ConfigurationRef) private _configuration: ViewConfig,
    @Inject(ViewManager) private _viewManager: ViewManager,
    @Inject(Renderer) private _renderer: Renderer
  ) {
    super(_container);

    this.visibilityChanges = this._visiblityChanges.asObservable().distinctUntilChanged();
    this.sizeChanges = this._sizeChanges.asObservable().distinctUntilChanged((p, c) => {
      return p.width === c.width && p.height === c.height;
    });

    this._renderer.afterRender
      .takeUntil(this.destroyed)
      .subscribe(this._postRender.bind(this));
  }

  get width(): number {
    return this._container.width;
  }

  get height(): number {
    return this._container.height;
  }

  render(): VNode {
    return h('div.ug-layout__view-container', {
      style: {
        width: `${this.width}px`,
        height: `${this.height}px`
      },
      hook: {
        create: (oldNode, newNode) => this._onCreate(newNode.elm as HTMLElement)
      }
    });
  }

  destroy(): void {
    this._sizeChanges.complete();
    this._visiblityChanges.complete();
  }

  close(args: { silent?: boolean } = {}): void {
    const { silent = false } = args;
    
    if (!silent) {
      const event = new BeforeDestroyEvent(this);
      
      this._eventBus.next(event);
      event.results().subscribe(() => this.destroy());
    } else {
      this.destroy();
    }
  }

  makeVisible(): void {
    this.emitUp(new MakeVisibleCommand(this));
  }

  minimize(): void {
    this.emitUp(new MinimizeCommand(this));
  }

  private _postRender(): void {
    this._visiblityChanges.next(this.isVisible());
    this._sizeChanges.next({ width: this.width, height: this.height });
  }

  private _onCreate(element: HTMLElement): void {
    this._element = element;
    
    this._viewContainer = this._viewManager.create<any>({
      element,
      config: this._configuration,
      injector: this._injector,
      container: this
    });
  }

  static configure(config: ViewConfig): ConfiguredRenderable<View> {
    return new ConfiguredRenderable(View, Object.assign({
      injectable: false
    }, config));
  }
}