import { Directive, Inject, TemplateRef, ViewContainerRef, SkipSelf } from '@angular/core';
import { ViewConfig, ViewContainer } from 'ug-layout';

import { UgLayoutRenderableDirective, UG_CONTAINER } from './UgLayoutRenderable.directive';

@Directive({
  selector: 'ug-layout-view'
})
export class UgLayoutViewDirective<T> extends UgLayoutRenderableDirective {
  constructor(
    // @Inject(TemplateRef) private _templateRef: TemplateRef<any>,
    @Inject(ViewContainerRef) private _viewContainerRef: ViewContainerRef,
    @Inject(UG_CONTAINER) @SkipSelf() _parent: UgLayoutRenderableDirective
  ) {
    super(_parent);
  }

  addChild(child: UgLayoutRenderableDirective): void {
    throw new Error();
  }

  getConfig(): ViewConfig {
    return {
      token: this,
      useFactory: this._factory.bind(this)
    };
  }

  private _factory(viewContainer: ViewContainer<T>): any {
    debugger;
  }
}