import {
  Directive,
  Inject,
  TemplateRef,
  ViewContainerRef,
  SkipSelf,
  Host,
  Component,
  ViewChild,
  ContentChild,
  ElementRef
} from '@angular/core';
import {
  ViewConfig,
  ViewContainer,
  View,
  ConfiguredRenderable,
  ViewManager,
  ViewComponent
} from 'ug-layout';

import {
  UgLayoutRenderableDirective,
  UG_CONTAINER
} from './UgLayoutRenderable.directive';
import { UG_ROOT_CONTAINER, UgLayoutDirective } from './UgLayout.directive';

@Directive({
  selector: '[ugLayoutView]'
})
export class UgLayoutViewDirective<T> extends UgLayoutRenderableDirective {
  private _token: Function;
  private _instance: any;

  constructor(
    @Inject(UG_CONTAINER) @Host() _parent: UgLayoutRenderableDirective,
    @Inject(TemplateRef)
    private templateRef: TemplateRef<{ $implicit: ViewContainer<T> }>,
    @Inject(ViewContainerRef) private viewContainerRef: ViewContainerRef
  ) {
    super(_parent);

    @ViewComponent()
    class TempViewComponent {}

    this._token = TempViewComponent;
    this._instance = new TempViewComponent();
  }

  get token(): Function {
    return this._token;
  }

  addChild(child: UgLayoutRenderableDirective): void {
    throw new Error();
  }

  getConfig(): ConfiguredRenderable<View> {
    return View.configure({
      token: this.token,
      useFactory: this._factory.bind(this),
      deps: [ViewContainer]
    });
  }

  private _factory(viewContainer: ViewContainer<T>): T {
    const viewRef = this.viewContainerRef.createEmbeddedView(this.templateRef, {
      $implicit: viewContainer
    });

    for (const node of viewRef.rootNodes) {
      viewContainer.element.appendChild(node);
    }

    return this._instance;
  }
}
