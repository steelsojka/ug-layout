import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Type, ProviderArg, Inject, Injector, Optional, forwardRef } from '../di';
import { Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef, ElementRef } from '../common';
import { Stack } from '../Stack';
import { ViewContainer } from './ViewContainer';
import { ViewConfig } from './common';
import { ViewManager } from './ViewManager';

export class View extends Renderable {
  private _viewContainer: ViewContainer<any>;
  private _element: HTMLElement;
  
  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(Injector) protected _injector: Injector,
    @Inject(ConfigurationRef) private _configuration: ViewConfig,
    @Inject(ViewManager) private _viewManager: ViewManager
  ) {
    super(_container);
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

  resize(): void {}

  isVisible(): boolean {
    return this._container.isVisible();
  }

  async close(args: { silent?: boolean } = {}): Promise<void> {
    const { silent = false } = args;
    
    if (!silent) {
      await this.waitForDestroy();
    }

    this.destroy();
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