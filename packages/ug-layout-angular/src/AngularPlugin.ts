import {
  Renderer,
  UgPlugin,
  RootLayout,
  ViewFactory,
  ProviderArg
} from 'ug-layout';
import { ViewContainerRef, Injector } from '@angular/core';

import { ANGULAR_PLUGIN, ANGULAR_GLOBAL } from './common';
import * as angular from './angular';
import { AngularViewFactory } from './AngularViewFactory';

export interface AngularPluginConfig {
  viewContainerRef: ViewContainerRef;
  ngInjector: Injector;
  scope?: angular.Scope;
  angularGlobal?: any;
  // Whether a detach child should be added as a style host.
  detachComponentStyles?: boolean;
}

export class AngularPlugin implements UgPlugin {
  private _viewContainerRef: ViewContainerRef;
  private _injector: Injector;
  private _scope: angular.Scope | null;
  private _angularGlobal: any;
  private _detachComponentStyles: boolean;

  constructor(config: AngularPluginConfig) {
    this.setInjector(config.ngInjector);
    this.setViewContainerRef(config.viewContainerRef);
    this._angularGlobal = config.angularGlobal || null;
    this._scope = config.scope || null;
    this._detachComponentStyles = !(config.detachComponentStyles === false);
  }

  initialize(root: RootLayout): void {
    const renderer = root.injector.get(Renderer);

    root.destroyed.subscribe(() => {
      this._viewContainerRef.clear();
      renderer.detach();
    });
  }

  configureProviders(providers: ProviderArg[]): ProviderArg[] {
    return [
      ...providers,
      { provide: ANGULAR_PLUGIN, useValue: this },
      { provide: ViewFactory, useClass: AngularViewFactory },
      { provide: ANGULAR_GLOBAL, useValue: this._angularGlobal }
    ];
  }

  get detachComponentStyles(): boolean {
    return this._detachComponentStyles;
  }

  get viewContainerRef(): ViewContainerRef {
    return this._viewContainerRef;
  }

  get injector(): Injector {
    return this._injector;
  }

  get scope(): angular.Scope | null {
    return this._scope;
  }

  setInjector(value: Injector): void {
    this._injector = value;
  }

  setViewContainerRef(value: ViewContainerRef): void {
    this._viewContainerRef = value;
  }
}
