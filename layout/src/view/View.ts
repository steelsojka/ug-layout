import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, ProviderArg, Inject, Injector, Optional, forwardRef } from '../di';
import { Renderer, Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef, ElementRef, DocumentRef } from '../common';
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
  private _visiblityChanges: Subject<boolean> = new Subject();
  private _sizeChanges: Subject<{ width: number, height: number }> = new Subject();

  /**
   * This element is the mount point that views can mount to.
   * The node created by the render method gets recreated when moved
   * somewhere else in the tree. This element is constant.
   * @private
   * @type {HTMLElement}
   */
  private _element: HTMLElement = this._document.createElement('div');
  
  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(Injector) protected _injector: Injector,
    @Inject(ConfigurationRef) private _configuration: ViewConfig,
    @Inject(ViewManager) private _viewManager: ViewManager,
    @Inject(DocumentRef) private _document: Document
  ) {
    super(_injector);

    this._element.classList.add('ug-layout__view-container-mount');
    this.visibilityChanges = this._visiblityChanges.asObservable().distinctUntilChanged();
    this.sizeChanges = this._sizeChanges.asObservable().distinctUntilChanged((p, c) => {
      return p.width === c.width && p.height === c.height;
    });

    this._renderer.rendered
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
      key: this.uid,
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

    super.destroy();
  }

  close(args: { silent?: boolean } = {}): void {
    const { silent = false } = args;
    
    if (!silent) {
      const event = new BeforeDestroyEvent(this);
      
      this._eventBus.next(event);
      event.results().subscribe(() => this.remove());
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
    if (!this._viewContainer) {
      this._viewContainer = this._viewManager.create<any>({
        element: this._element,
        config: this._configuration,
        injector: this._injector,
        container: this
      });
    }

    element.appendChild(this._element);
  }

  static configure(config: ViewConfig): ConfiguredRenderable<View> {
    return new ConfiguredRenderable(View, config);
  }
}