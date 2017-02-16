import { 
  Inject, 
  RootLayout, 
  RootLayoutConfig, 
  RootConfigRef,
  Renderer,
  Injector
} from 'ug-layout';
import { ViewContainerRef, Injector as NgInjector } from '@angular/core';

export interface AngularRootLayoutConfig extends RootLayoutConfig<AngularRootLayout> {
  viewContainerRef: ViewContainerRef;
  ngInjector: NgInjector;
}

export class AngularRootLayout extends RootLayout {
  constructor(
    @Inject(RootConfigRef) protected _config: AngularRootLayoutConfig,
    @Inject(Renderer) protected _renderer: Renderer,
    @Inject(Injector) _injector: Injector
  ) {
    super(_config, _renderer, _injector);
  }
  
  destroy(): void {
    this._config.viewContainerRef.clear();
    this._renderer.detach();
    
    super.destroy();
  }
  
  static create(config: AngularRootLayoutConfig): AngularRootLayout {
    return RootLayout.create<AngularRootLayout>(Object.assign(config, { use: AngularRootLayout }));
  }
}