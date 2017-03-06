import {
  ReflectiveInjector,
  ComponentFactoryResolver,
  Injector,
  ComponentRef,
  Input,
  ApplicationRef,
  ElementRef,
  Type
} from '@angular/core';
import {
  Renderable,
  ViewFactory,
  ViewContainer,
  ViewFactoryArgs,
  ViewConfig,
  ViewFactoriesRef,
  RootConfigRef,
  Inject,
  VIEW_CONFIG_KEY,
  View,
  ConfigurationRef,
  ContainerRef,
  ViewManager,
  DocumentRef
} from 'ug-layout';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AngularRootLayoutConfig } from './RootLayout';
import { AngularPluginConfigRef, AngularPluginConfig } from './AngularPlugin';
import {
  COMPONENT_REF_KEY,
  ViewComponentConfig,
  SCOPE_REF_KEY,
  AngularInjectorRef
} from './common';

export class AngularView extends View {
  private _componentFactoryResolver: ComponentFactoryResolver;
  private _isInitialized: boolean = false;
  private _ng1Bootstrapped: Subject<void> = new Subject<void>();
  private _isNg1Bootstrapped: boolean = false;
  private _isCheckingForNg1: boolean = false;
  private _injector: Injector;

  constructor(
    @Inject(RootConfigRef) private _rootConfig: AngularRootLayoutConfig,
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(ConfigurationRef) _configuration: ViewConfig,
    @Inject(ViewManager) _viewManager: ViewManager,
    @Inject(ViewFactory) _viewFactory: ViewFactory,
    @Inject(DocumentRef) _document: Document,
    @Inject(AngularPluginConfigRef) private _pluginConfig: AngularPluginConfig
  ) {
    super(_container, _configuration, _viewManager, _viewFactory, _document);
    
    this._injector = this._pluginConfig.ngInjector;
    this._componentFactoryResolver = this._injector.get(ComponentFactoryResolver);
    
    this._configuration = {
      token: this._viewFactory.getTokenFrom(this._configuration),
      useFactory: this._factory.bind(this),
      deps: [ ViewContainer ]
    };
  }

  /**
   * This is very ugly, but NG2 doesn't let us know when NG1 is bootstrapped, so we need to
   * pull for when it's ready. In reality this only gets invoked 2 or 3 times so it's not that big of a deal.
   * @private
   */
  private _checkForNg1Init(): void {
    this._isCheckingForNg1 = true;
    
    if (this._injector.get('$injector', null)) {
      this._isNg1Bootstrapped = true;
      this._ng1Bootstrapped.next();
      this._ng1Bootstrapped.complete();
    } else {
      setTimeout(() => this._checkForNg1Init());
    }
  }

  private async _factory<T>(config: ViewConfig, viewContainer: ViewContainer<T>): Promise<T> {
    const token = this._viewFactory.getTokenFrom(this._configuration);
    
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig;
    
    // TODO: Add interceptor logic here

    if (metadata.upgrade) {
      return await this._ng1Factory(config, viewContainer);
    }

    return await this._ng2Factory(config, viewContainer);
  }

  private async _ng1Factory<T>(config: ViewConfig, viewContainer: ViewContainer<T>): Promise<T> {
    if (!this._isNg1Bootstrapped) {
      if (!this._isCheckingForNg1) {
        this._checkForNg1Init();
      }
      
      await this._ng1Bootstrapped.toPromise();
    }

    const token = this._viewFactory.getTokenFrom(this._configuration);
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig;
    const ng1Injector = this._injector.get('$injector') as ng.auto.IInjectorService;
    const $rootScope = ng1Injector.get('$rootScope') as ng.IRootScopeService;
    const $compile = ng1Injector.get('$compile') as ng.ICompileService;
    const $templateCache = ng1Injector.get('$templateCache') as ng.ITemplateCacheService;
    const scope = $rootScope.$new();
    let linkFn: ng.ITemplateLinkingFunction;

    if (metadata.template) {
      linkFn = $compile(metadata.template);
    } else if (metadata.templateUrl) {
      const template = $templateCache.get<string>(metadata.templateUrl);

      if (!template) {
        throw new Error(`Could not find template at path ${template}`);
      }

      linkFn = $compile(template);
    } else {
      throw new Error('A template is required for upgraded NG1 components!');
    }

    // Instaniate our controller for the component.
    const ctrl = ng1Injector.instantiate(token, this._getNg1Providers(config, viewContainer.element, viewContainer)) as T;

    // Assign it to scope.
    scope[metadata.controllerAs || '$ctrl'] = ctrl;
    ctrl[SCOPE_REF_KEY] = scope;
    
    if (typeof ctrl['$onInit'] === 'function') {
      ctrl['$onInit']();
    }

    // Link the view to the controller.
    const $el = linkFn(scope);

    viewContainer.mount($el[0]);
    viewContainer.destroyed.subscribe(() => this._onNg1ComponentDestroyed(scope, viewContainer));

    if (typeof ctrl['$postLink'] === 'function') {
      ctrl['$postLink']();
    }

    return ctrl;
  }

  private async _ng2Factory<T>(config: ViewConfig, viewContainer: ViewContainer<T>): Promise<T> {
    const token = this._viewFactory.getTokenFrom(this._configuration);
    
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const injector = ReflectiveInjector.resolveAndCreate([
      { provide: ElementRef, useValue: new ElementRef(viewContainer.element) },
      { provide: ViewContainer, useValue: viewContainer }
    ], this._rootConfig.ngInjector);
    
    const componentRef = this._rootConfig.viewContainerRef.createComponent(
      componentFactory,
      undefined,
      injector
    );
    
    componentRef.instance[COMPONENT_REF_KEY] = componentRef;
    
    viewContainer.mount(componentRef.location.nativeElement);
    viewContainer.destroyed.subscribe(this._onComponentDestroy.bind(this, componentRef));
    viewContainer.attached.subscribe(this._onAttachChange.bind(this, true, componentRef));
    viewContainer.detached.subscribe(this._onAttachChange.bind(this, false, componentRef));
    componentRef.changeDetectorRef.detectChanges();
    
    return componentRef.instance;
  }

  private _onNg1ComponentDestroyed<T>(scope: ng.IScope, container: ViewContainer<T>): void {
    if (container.component && typeof container.component['$onDestroy'] === 'function') {
      container.component['$onDestroy']();
    }

    scope.$destroy();
  }

  private _onAttachChange<T>(isAttached: boolean, componentRef: ComponentRef<T>): void {
    if (isAttached) {
      componentRef.changeDetectorRef.reattach();
    } else {
      componentRef.changeDetectorRef.detach();
    }
  }

  private _onComponentDestroy<T>(componentRef: ComponentRef<T>): void {
    const index = this._rootConfig.viewContainerRef.indexOf(componentRef.hostView);
    
    if (index !== -1) {
      this._rootConfig.viewContainerRef.remove(index);
    }
  }

  protected _getNg1Providers<T>(config: ViewConfig, elementRef: HTMLElement, viewContainer: ViewContainer<T>): { [key: string]: any } {
    return {
      viewContainer,
      $element: elementRef
    };
  }
}