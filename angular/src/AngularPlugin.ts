import { Renderer, UgPlugin, RootLayout, Token } from 'ug-layout';
import { ViewContainerRef, Injector } from '@angular/core';

import * as angular from './angular';

export interface AngularPluginConfig {
  viewContainerRef: ViewContainerRef;
  ngInjector: Injector;
  scope?: angular.Scope;
}

export class AngularPlugin extends UgPlugin {
  private _viewContainerRef: ViewContainerRef;
  private _injector: Injector;
  private _scope: angular.Scope|null;

  constructor(config: AngularPluginConfig) {
    super();

    this.setInjector(config.ngInjector);
    this.setViewContainerRef(config.viewContainerRef);
    this._scope = config.scope || null;
  }
  
  initialize(root: RootLayout): void {
    const renderer = root.injector.get(Renderer);
    
    root.injector.registerProvider({ provide: AngularPlugin, useValue: this });
    root.destroyed.subscribe(() => {
      this._viewContainerRef.clear();
      renderer.detach();
    });
  }

  get viewContainerRef(): ViewContainerRef {
    return this._viewContainerRef;
  }

  get injector(): Injector {
    return this._injector;
  }

  get scope(): angular.Scope|null {
    return this._scope;
  }

  setInjector(value: Injector): void {
    this._injector = value;
  }

  setViewContainerRef(value: ViewContainerRef): void {
    this._viewContainerRef = value;
  }
}