import {
  ReflectiveInjector,
  ComponentFactoryResolver,
  Injector,
  ComponentRef,
  Input,
  ApplicationRef,
  ElementRef,
  Type,
  Provider,
  ViewContainerRef
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
  DocumentRef,
  ConfiguredRenderable
} from 'ug-layout';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';

import { AngularPlugin } from './AngularPlugin';
import {
  COMPONENT_REF_KEY,
  ViewComponentConfig,
  SCOPE_REF_KEY,
  AngularInjectorRef
} from './common';

export class AngularView extends View {
  protected component: Type<any>;
  
  protected _componentFactoryResolver: ComponentFactoryResolver;
  protected _isInitialized: boolean = false;
  protected _ng1Bootstrapped: Subject<void> = new Subject<void>();
  protected _isNg1Bootstrapped: boolean = false;
  protected _isCheckingForNg1: boolean = false;

  constructor(
    @Inject(ContainerRef) protected _container: Renderable,
    @Inject(ConfigurationRef) _configuration: ViewConfig,
    @Inject(ViewManager) _viewManager: ViewManager,
    @Inject(ViewFactory) _viewFactory: ViewFactory,
    @Inject(DocumentRef) _document: Document,
    @Inject(AngularPlugin) private _plugin: AngularPlugin
  ) {
    super(_container, _configuration, _viewManager, _viewFactory, _document);
    
    this._componentFactoryResolver = this._injector.get(ComponentFactoryResolver);
    this.component = this._viewFactory.getTokenFrom(this._configuration);
    
    this._configuration = {
      ..._configuration,
      token: this.component,
      useFactory: this.factory.bind(this),
      deps: [ ViewContainer ]
    };
  }

  protected get _injector(): Injector {
    return this._plugin.injector;
  }

  protected get _viewContainerRef(): ViewContainerRef {
    return this._plugin.viewContainerRef;
  }

  /**
   * This is very ugly, but NG2 doesn't let us know when NG1 is bootstrapped, so we need to
   * pull for when it's ready. In reality this only gets invoked 2 or 3 times so it's not that big of a deal.
   * @private
   */
  protected _checkForNg1Init(): void {
    this._isCheckingForNg1 = true;
    
    if (this._injector.get('$injector', null)) {
      this._isNg1Bootstrapped = true;
      this._ng1Bootstrapped.next();
      this._ng1Bootstrapped.complete();
    } else {
      setTimeout(() => this._checkForNg1Init());
    }
  }

  protected async factory<T>(viewContainer: ViewContainer<T>): Promise<T> {
    const metadata = Reflect.getMetadata(VIEW_CONFIG_KEY, this.component) as ViewComponentConfig;

    if (metadata.upgrade) {
      return await this._ng1Factory(viewContainer);
    }

    return await this._ng2Factory(viewContainer);
  }

  private async _ng1Factory<T>(viewContainer: ViewContainer<T>): Promise<T> {
    if (!this._isNg1Bootstrapped) {
      if (!this._isCheckingForNg1) {
        this._checkForNg1Init();
      }
      
      await this._ng1Bootstrapped.toPromise();
    }

    const token = this.component;
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
    const ctrl = ng1Injector.instantiate(token, this.getNg1Providers({
      $element: viewContainer.element, 
      $scope: scope,
      viewContainer
    }, viewContainer)) as T;

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

  private async _ng2Factory<T>(viewContainer: ViewContainer<T>): Promise<T> {
    const token = this.component;
    
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const injector = ReflectiveInjector.resolveAndCreate(
      this.getNg2Providers(
        [
          { provide: ElementRef, useValue: new ElementRef(viewContainer.element) },
          { provide: ViewContainer, useValue: viewContainer }
        ],
        viewContainer
      ), 
      this._injector
    );
    
    const componentRef = this._viewContainerRef.createComponent(
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
    const index = this._viewContainerRef.indexOf(componentRef.hostView);
    
    if (index !== -1) {
      this._viewContainerRef.remove(index);
    }
  }

  protected getNg1Providers(providers: { [key: string]: any }, viewContainer: ViewContainer<any>): { [key: string]: any } {
    return providers;
  }
  
  protected getNg2Providers(providers: Provider[], viewContainer: ViewContainer<any>): Provider[] {
    return providers;
  }

  static configure(config: ViewConfig): ConfiguredRenderable<AngularView> {
    return new ConfiguredRenderable(AngularView, config);
  }
}