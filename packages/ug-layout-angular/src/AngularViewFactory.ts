import {
  Inject,
  ViewFactory,
  PostConstruct,
  ViewContainer,
  ViewFactoryArgs,
  VIEW_COMPONENT_CONFIG,
  ConfiguredItem,
  TagUtil,
  ViewConfig,
  VIEW_CONFIG_KEY
} from 'ug-layout';
import {
  Injector,
  ViewContainerRef,
  ComponentFactoryResolver,
  Type,
  ReflectiveInjector,
  ComponentFactory,
  ComponentRef,
  ElementRef,
  Provider
} from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/toPromise';
import 'rxjs/add/operator/mergeMap';

import * as angular from './angular';
import { AngularPlugin } from './AngularPlugin';
import { DestroyNotifyEvent } from './DestroyNotifyEvent';
import { Angular1ComponentFactory } from './Angular1ComponentFactory';
import {
  ANGULAR_TAG,
  ViewComponentConfig,
  COMPONENT_REF_KEY,
  ANGULAR_PLUGIN,
  ANGULAR_GLOBAL
} from './common';

export class AngularViewFactory extends ViewFactory {
  @Inject(ANGULAR_PLUGIN) protected _plugin: AngularPlugin;
  @Inject(ANGULAR_GLOBAL) protected _angularGlobal: any;

  protected _componentFactoryResolver: ComponentFactoryResolver;
  protected _ng1Bootstrapped: Subject<void> = new Subject<void>();
  protected _isNg1Bootstrapped: boolean = false;
  protected _isCheckingForNg1: boolean = false;

  protected get _ng2Injector(): Injector {
    return this._plugin.injector;
  }

  protected get _viewContainerRef(): ViewContainerRef {
    return this._plugin.viewContainerRef;
  }

  @PostConstruct()
  init(): void {
    this._componentFactoryResolver = this._ng2Injector.get(ComponentFactoryResolver);
  }

  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    // Pass through for non angular components.
    if (!TagUtil.matchesTags(args.config, [ ANGULAR_TAG ])) {
      return super.create<T>(args);
    }

    let viewConfig = null;

    if (args.config.useClass) {
      viewConfig = ConfiguredItem.resolveConfig<any>(args.config.useClass, null);
    } else if (args.config.useFactory) {
      viewConfig = ConfiguredItem.resolveConfig<any>(args.config.useFactory, null);
    }

    const component = this.getTokenFrom(args.config);

    return super.create<T>({
      ...args,
      config: {
        ...args.config,
        token: component,
        useFactory: new ConfiguredItem(this.createFactory<T>(component, args.config), viewConfig),
        deps: [ ViewContainer, VIEW_COMPONENT_CONFIG ]
      }
    });
  }

  protected createFactory<T>(component: Type<T>, config: ViewConfig): (...args: any[]) => Promise<T> {
    return async (viewContainer: ViewContainer<T>, config: any): Promise<T> => {
      const metadata = Reflect.getMetadata(VIEW_CONFIG_KEY, component) as ViewComponentConfig;

      if (metadata.upgrade) {
        return await this._ng1Factory(viewContainer, component, config);
      }

      return await this._ng2Factory(viewContainer, component, config);
    };
  }

  private async _ng1Factory<T>(viewContainer: ViewContainer<T>, component: Type<T>, config: any): Promise<T> {
    if (!this._isNg1Bootstrapped) {
      if (!this._isCheckingForNg1) {
        this._checkForNg1Init();
      }

      await this._ng1Bootstrapped.toPromise();
    }

    const token = component;
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig;
    const ng1Injector = this._ng2Injector.get('$injector') as angular.Injector;
    const componentRef = ng1Injector.instantiate<Angular1ComponentFactory<T>>(Angular1ComponentFactory, {
      viewContainer,
      Component: token,
      config: metadata,
      $scope: this._plugin.scope || ng1Injector.get<angular.Scope>('$rootScope'),
      angularGlobal: this._angularGlobal,
      providers: this.getNg1Providers({
        viewComponentConfig: config
      }, viewContainer)
    });

    viewContainer.destroyed
      .subscribe(() => this._onNg1ComponentDestroyed(componentRef.scope, viewContainer));

    return componentRef.create();
  }

  private async _ng2Factory<T>(viewContainer: ViewContainer<T>, component: Type<T>, config: any): Promise<T> {
    const token = component;

    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const injector = ReflectiveInjector.resolveAndCreate(
      this.getNg2Providers(
        [
          { provide: ElementRef, useValue: new ElementRef(viewContainer.element) },
          { provide: ViewContainer, useValue: viewContainer },
          { provide: VIEW_COMPONENT_CONFIG, useValue: config }
        ],
        viewContainer
      ),
      this._ng2Injector
    );

    const componentRef = this._viewContainerRef.createComponent(
      componentFactory,
      undefined,
      injector
    );

    this._setupInputs<T>(componentFactory, componentRef);

    componentRef.instance[COMPONENT_REF_KEY] = componentRef;
    viewContainer.mount(componentRef.location.nativeElement);

    viewContainer.destroyed
      .subscribe(() => this._onComponentDestroy(componentRef, componentFactory));

    viewContainer.attached
      .subscribe(() => this._onAttachChange(true, componentRef, viewContainer));

    viewContainer.detached
      .subscribe(() => this._onAttachChange(false, componentRef, viewContainer));

    // This is needed for dynamic components...
    componentRef.changeDetectorRef.markForCheck();

    return componentRef.instance;
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

  /**
   * This is very ugly, but NG2 doesn't let us know when NG1 is bootstrapped, so we need to
   * pull for when it's ready. In reality this only gets invoked 2 or 3 times so it's not that big of a deal.
   * @private
   */
  protected _checkForNg1Init(): void {
    this._isCheckingForNg1 = true;

    if (this._ng2Injector.get('$injector', null)) {
      this._isNg1Bootstrapped = true;
      this._ng1Bootstrapped.next();
      this._ng1Bootstrapped.complete();
    } else {
      setTimeout(() => this._checkForNg1Init());
    }
  }

  private _setupInputs<T>(factory: ComponentFactory<T>, componentRef: ComponentRef<T>): void {
    for (const input of factory.inputs) {
      const descriptor = Object.getOwnPropertyDescriptor(componentRef.instance, input.propName)
        // Account for getter/setters
        || Object.getOwnPropertyDescriptor(componentRef.componentType.prototype, input.propName);

      if (descriptor) {
        let { set, get, value } = descriptor;

        if (!set && !get) {
          set = v => value = v;
          get = () => value;
        }

        Object.defineProperty(componentRef.instance, input.propName, {
          get,
          enumerable: descriptor.enumerable,
          configurable: true,
          set(value) {
            if (set) {
              set.call(this, value);
            }

            componentRef.changeDetectorRef.detectChanges();
          }
        });
      }
    }
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

  private _onNg1ComponentDestroyed<T>(scope: angular.Scope, container: ViewContainer<T>): void {
    if (container.component && typeof container.component['$onDestroy'] === 'function') {
      container.component['$onDestroy']();
    }

    scope.$destroy();

    // Angular 1 emits a `$destroy` event when a node is removed from the DOM.
    // We need to simulate this event.
    if (this._angularGlobal) {
      this._angularGlobal.element(container.element).remove();
    }
  }

  private _onComponentDestroy<T>(componentRef: ComponentRef<T>, componentFactory: ComponentFactory<T>): void {
    const index = this._viewContainerRef.indexOf(componentRef.hostView);

    if (index !== -1) {
      this._viewContainerRef.remove(index);
    }

    componentRef.destroy();

    for (const output of componentFactory.outputs) {
      if (typeof componentRef.instance === 'object'
        && typeof componentRef.instance[output.propName] === 'object'
        && typeof componentRef.instance[output.propName].complete === 'function') {
        componentRef.instance[output.propName].complete();
      }
    }
  }

  protected getNg1Providers(providers: { [key: string]: any }, viewContainer: ViewContainer<any>): { [key: string]: any } {
    return providers;
  }

  protected getNg2Providers(providers: Provider[], viewContainer: ViewContainer<any>): Provider[] {
    return providers;
  }
}