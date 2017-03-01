import { 
  RootLayout, 
  RootLayoutCreationConfig,
  RootConfigRef
} from 'ug-layout';
import { ViewContainerRef, Injector } from '@angular/core';

export interface AngularRootLayoutConfig extends RootLayoutCreationConfig {
  viewContainerRef: ViewContainerRef;
  ngInjector: Injector;
}

export class AngularRootLayout extends RootLayout {
  destroy(): void {
    const config = this._injector.get(RootConfigRef) as AngularRootLayoutConfig;
    
    config.viewContainerRef.clear();
    this._renderer.detach();
    
    super.destroy();
  }
  
  static create(config: AngularRootLayoutConfig): AngularRootLayout {
    return RootLayout.create<AngularRootLayout>(config as RootLayoutCreationConfig);
  }
}