import { Directive, Inject, forwardRef, SkipSelf } from '@angular/core';
import { ConfiguredRenderable, RowConfig } from 'ug-layout';

import { UgLayoutRenderableDirective, UG_CONTAINER } from './UgLayoutRenderable.directive';

@Directive({
  selector: 'ug-layout-row',
  providers: [
    { provide: UG_CONTAINER, useExisting: forwardRef(() => UgLayoutRowDirective) }
  ]
})
export class UgLayoutRowDirective extends UgLayoutRenderableDirective {
  private _children: UgLayoutRenderableDirective[] = [];

  constructor(
    @Inject(UG_CONTAINER) @SkipSelf() _parent: UgLayoutRenderableDirective
  ) {
    super(_parent);
  }

  addChild(child: UgLayoutRenderableDirective): void {
    this._children.push(child);
  }

  getConfig(): RowConfig {
    return {
      children: this._children.map(child => child.getConfig())
    };
  }
}