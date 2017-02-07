import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { ProviderArg, Inject, Injector, Optional } from '../di';
import { Renderable, ConfiguredRenderable } from '../dom';
import { ContainerRef, ConfigurationRef } from '../common';
import { Stack } from '../Stack';
import { ViewContainer } from './ViewContainer';
import { ViewFactoriesRef, ViewFactoryRef } from './common';

export interface ViewConfig {
  injectable?: boolean;
  name?: string;
  factory?: ViewFactory;
}

export type ViewFactory = (element: HTMLElement, container: ViewContainer) => void;

export class View extends Renderable {
  private _viewContainer: ViewContainer;
  private _element: HTMLElement;
  private _factory: ViewFactory;
  private _viewInjector: Injector;
  
  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(Injector) protected _injector: Injector,
    @Inject(ConfigurationRef) private _configuration: ViewConfig|null,
    @Inject(ViewFactoriesRef) @Optional() private _factories: Map<string, ViewFactory>|null
  ) {
    super(_container);

    let providers: ProviderArg[] = [
      { provide: ContainerRef, useValue: this },
      ViewContainer
    ];

    if (this._configuration) {
      if (this._configuration.factory) {
        this._factory = this._configuration.factory;
      } else if (this._factories) {
        if (!this._configuration.name || !this._factories.has(this._configuration.name)) {
          throw new Error(`${this._configuration.name} is not a configured view.`);
        }

        this._factory = this._factories.get(this._configuration.name) as ViewFactory;
      }

      if (this._configuration.injectable) {
        providers.push({
          provide: ViewFactoryRef,
          useClass: this._factory as any
        });
      } else {
        providers.push({
          provide: ViewFactoryRef,
          useFactory: () => this._factory(this._element, this._viewContainer)
        });
      }
    }

    this._viewInjector = Injector.fromInjectable(ViewContainer, providers, this._injector)
    this._viewContainer = this._viewInjector.get(ViewContainer);
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

  private _onCreate(element: HTMLElement): void {
    this._element = element;
    this._viewInjector.get(ViewFactoryRef, null);
  }

  static configure(config: ViewConfig): ConfiguredRenderable<View> {
    return new ConfiguredRenderable(View, config);
  }
}