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
  ConfiguredRenderable,
  ViewContainerStatus
} from 'ug-layout';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/mergeMap';

import { AngularPlugin } from './AngularPlugin';
import { DestroyNotifyEvent } from './DestroyNotifyEvent';
import { Angular1ComponentFactory } from './Angular1ComponentFactory';
import {
  COMPONENT_REF_KEY,
  ViewComponentConfig,
  SCOPE_REF_KEY
} from './common';

export class AngularView extends View {
  protected component: Type<any>;
  
  protected _componentFactoryResolver: ComponentFactoryResolver;
  protected _isInitialized: boolean = false;
  protected _ng1Bootstrapped: Subject<void> = new Subject<void>();
  protected _isNg1Bootstrapped: boolean = false;
  protected _isCheckingForNg1: boolean = false;
  protected _destroyNotified: Subject<void> = new Subject<void>();

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

  initialize(): void {
    super.initialize();

    this.viewContainerCreated
      .mergeMap(container => container.componentReady.filter(Boolean))
      .map(() => this._viewContainer)
      .subscribe(this._onComponentInitialized.bind(this));
  }

  protected _onComponentInitialized<T>(viewContainer: ViewContainer<T>): void {
    if (viewContainer.component) {
      const componentRef = viewContainer.component[COMPONENT_REF_KEY];

      if (componentRef) {
        if (componentRef instanceof ComponentRef) {
          this._onNg2ComponentInitialized(viewContainer, componentRef);
        } else if (componentRef instanceof Angular1ComponentFactory) {
          this._onNg1ComponentInitialized(viewContainer, componentRef);
        }
      }
    }
  }

  protected _onNg1ComponentInitialized<T>(viewContainer: ViewContainer<T>, componentRef: Angular1ComponentFactory<T>): void {
    viewContainer.destroyed
      .takeUntil(this.destroyed)
      .subscribe(() => this._onNg1ComponentDestroyed(componentRef.scope, viewContainer));
  }
  
  protected _onNg2ComponentInitialized<T>(viewContainer: ViewContainer<T>, componentRef: ComponentRef<T>): void {
    viewContainer.destroyed
      .takeUntil(this.destroyed)
      .subscribe(() => this._onComponentDestroy(componentRef));

    viewContainer.attached
      .takeUntil(this.destroyed)
      .subscribe(() => this._onAttachChange(true, componentRef, viewContainer));

    viewContainer.detached
      .takeUntil(this.destroyed)
      .subscribe(() => this._onAttachChange(false, componentRef, viewContainer));

    this.subscribe(DestroyNotifyEvent, this._onDestroyNotify.bind(this, componentRef, viewContainer));
    componentRef.changeDetectorRef.detectChanges();
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
    const componentRef = ng1Injector.instantiate<Angular1ComponentFactory<T>>(Angular1ComponentFactory, {
      viewContainer,
      Component: token,
      config: metadata,
      providers: this.getNg1Providers({}, viewContainer)
    })

    return componentRef.create();
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
    
    return componentRef.instance;
  }

  private _getComponentInfo<T>(): { container: ViewContainer<T>, componentRef: ComponentRef<T> }|null {
    if (this._viewContainer && this._viewContainer.component && this._viewContainer.component[COMPONENT_REF_KEY]) {
      return {
        container: this._viewContainer,
        componentRef: this._viewContainer.component[COMPONENT_REF_KEY]
      };
    }

    return null;
  }

  private _onDestroyNotify<T>(componentRef: ComponentRef<T>, viewContainer: ViewContainer<T>): void {
    const index = this._viewContainerRef.indexOf(componentRef.hostView);

    if (viewContainer.isCacheable) {
      componentRef.hostView.detach();

      if (index !== -1) {
        this._viewContainerRef.detach(index);
      }
    }
  }

  private _onNg1ComponentDestroyed<T>(scope: ng.IScope, container: ViewContainer<T>): void {
    if (container.component && typeof container.component['$onDestroy'] === 'function') {
      container.component['$onDestroy']();
    }

    scope.$destroy();
  }

  private _onAttachChange<T>(isAttached: boolean, componentRef: ComponentRef<T>, viewContainer: ViewContainer<T>): void {
    const index = this._viewContainerRef.indexOf(componentRef.hostView);
    const hasViewRef = index !== -1;

    if (isAttached) {
      componentRef.hostView.reattach();

      // The view container ref could have changed, so if we reattach, attach to the correct container.
      if (!hasViewRef) {
        this._viewContainerRef.insert(componentRef.hostView);
        viewContainer.mount(componentRef.location.nativeElement);
      }
    } else {
      componentRef.hostView.detach();

      if (hasViewRef) {
        this._viewContainerRef.detach(index);
      }
    }
  }

  private _onComponentDestroy<T>(componentRef: ComponentRef<T>): void {
    const index = this._viewContainerRef.indexOf(componentRef.hostView);
    
    if (index !== -1) {
      this._viewContainerRef.remove(index);
    }

    componentRef.destroy();
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