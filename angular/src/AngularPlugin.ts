import { Renderer, UgPlugin, RootLayout, Token } from 'ug-layout';
import { ViewContainerRef, Injector } from '@angular/core';

export const AngularPluginConfigRef = new Token('AngularPluginConfigRef');

export interface AngularPluginConfig {
  viewContainerRef: ViewContainerRef;
  ngInjector: Injector;
}

export class AngularPlugin extends UgPlugin {
  constructor(private _config: AngularPluginConfig) {
    super();
  }
  
  initialize(root: RootLayout): void {
    const renderer = root.injector.get(Renderer);
    
    root.injector.registerProvider({ provide: AngularPluginConfigRef, useValue: this._config });
    root.destroyed.subscribe(() => {
      this._config.viewContainerRef.clear();
      renderer.detach();
    });
  }
}