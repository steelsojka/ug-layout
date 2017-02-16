import { ComponentFactoryResolver, Injector, ComponentRef, Input } from '@angular/core';
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
        deps: [ ElementRef ]
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

  private async _factory<T>(config: ViewConfig, elementRef: HTMLElement): Promise<T> {
    const token = this.getTokenFrom(config);
    
    const componentFactory = this._componentFactoryResolver.resolveComponentFactory<T>(token);
    const componentRef = componentFactory.create(this._ngInjector);
    
    window['componentRef'] = componentRef;

    elementRef.appendChild(componentRef.location.nativeElement);

    // TODO: Add interceptor logic here

    this._wireInputs(token, componentRef)

    componentRef.changeDetectorRef.detectChanges();
    
    return componentRef.instance;
  }

  private _wireInputs<T>(token: any, componentRef: ComponentRef<T>): void {
    const metadata = Reflect.getOwnMetadata('propMetadata', token) || {};

    const inputs = Object.keys(metadata)
      .map(key => {
        return {
          key, 
          value: metadata[key][metadata[key].length - 1]
        };
      })
      .filter(entry => entry.value instanceof Input);

    for (const entry of inputs) {
      const descriptor = Object.getOwnPropertyDescriptor(componentRef.instance, entry.key);
      const { get, set, value } = descriptor;

      if (!get && descriptor.hasOwnProperty('value')) {
        descriptor.get = function() { return this[`__$${entry.key}`]; };
      }
      
      descriptor.set = function(val) {
        if (set) {
          set.call(this, val);
        } else {
          this[`__$${entry.key}`] = val;
        }
        
        componentRef.changeDetectorRef.detectChanges();
      };
          
      componentRef.instance[`__$${entry.key}`] = value;
      
      delete descriptor.value;
      delete descriptor.writable;

      Object.defineProperty(componentRef.instance, entry.key, descriptor);
      
      console.log(descriptor);
      // Object.defineProperty(componentRef.instance, entry.key, {
            
      // });
    }
  }
}