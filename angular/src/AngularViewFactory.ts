import { ComponentFactoryResolver, Injector } from '@angular/core';
import { 
  ElementRef, 
  ViewFactory, 
  ViewContainer, 
  ViewFactoryArgs, 
  ViewConfig 
} from 'ug-layout';

export class AngularViewFactory extends ViewFactory {
  private _componentFactoryResolver: ComponentFactoryResolver;
  private _ngInjector: Injector;
  private _isInitialized: boolean = false;
  
  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    const { injector, config, element, container } = args;

    if (!this._isInitialized) {
      throw new Error('AngularViewFactory needs to be initialized prior to using');
    }

    return super.create<T>({
      injector, element, container,
      config: {
        token: this.getTokenFrom(config),
        useFactory: this._factory.bind(this, config),
        deps: [ ViewContainer, ElementRef ]
      }
    });
  }

  initialize(
    componentFactoryResolver: ComponentFactoryResolver,
    injector: Injector
  ) {
    this._componentFactoryResolver = componentFactoryResolver;
    this._ngInjector = injector;
    this._isInitialized = true;
  }

  private _factory<T>(config: ViewConfig, elementRef: HTMLElement): Promise<T> {
    const token = this.getTokenFrom(config);
    
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const componentRef = componentFactory.create(this._ngInjector);

    elementRef.appendChild(componentRef.location.nativeElement);

    return Promise.resolve(componentRef.instance);
  }
}