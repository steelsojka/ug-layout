import { ViewContainer } from 'ug-layout';
import { Type } from '@angular/core';

import { ViewComponentConfig, COMPONENT_REF_KEY } from './common';

export class Angular1ComponentFactory<T> {
  static $inject = [
    '$compile',
    '$rootScope',
    '$templateCache',
    '$injector',
    'viewContainer',
    'Component',
    'config',
    'providers'
  ];

  private _scope: ng.IScope;
  private _instance: T;
  private _element: HTMLElement;

  constructor(
    private _$compile: ng.ICompileService,
    private _$scope: ng.IScope,
    private _$templateCache: ng.ITemplateCacheService,
    private _$injector: ng.auto.IInjectorService,
    private _viewContainer: ViewContainer<T>,
    private _Component: Type<any>,
    private _config: ViewComponentConfig,
    private _providers: { [key: string]: any }
  ) {}

  get scope(): ng.IScope {
    return this._scope;
  }

  get instance(): T {
    return this._instance;
  }

  get element(): HTMLElement {
    return this._element;
  }

  create(): T {
    this._scope = this._$scope.$new();

    let linkFn: ng.ITemplateLinkingFunction;

    if (this._config.template) {
      linkFn = this._$compile(this._config.template);
    } else if (this._config.templateUrl) {
      const template = this._$templateCache.get<string>(this._config.templateUrl);

      if (!template) {
        throw new Error(`Could not find template at path ${template}`);
      }

      linkFn = this._$compile(template);
    } else {
      throw new Error('A template is required for upgraded NG1 components!');
    }

    // Instaniate our controller for the component.
    this._instance = this._$injector.instantiate(this._Component, {
      ...this._providers,
      $element: this._viewContainer.element, 
      $scope: this.scope,
      viewContainer: this._viewContainer
    }) as T;

    // Assign it to scope.
    this.scope[this._config.controllerAs || '$ctrl'] = this.instance;
    this.instance[COMPONENT_REF_KEY] = this;
    
    if (typeof this.instance['$onInit'] === 'function') {
      this.instance['$onInit']();
    }

    // Link the view to the controller.
    this._element = linkFn(this.scope)[0];

    if (typeof this.instance['$postLink'] === 'function') {
      this.instance['$postLink']();
    }

    this._viewContainer.mount(this._element);

    return this.instance;
  }
}