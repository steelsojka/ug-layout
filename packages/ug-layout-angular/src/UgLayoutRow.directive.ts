import { Directive, Inject, forwardRef, SkipSelf, Host } from '@angular/core';
import { ConfiguredRenderable, Row, Column } from 'ug-layout';

import {
  UgLayoutRenderableDirective,
  UG_CONTAINER
} from './UgLayoutRenderable.directive';

export abstract class UgLayoutXYDirective extends UgLayoutRenderableDirective {
  protected _children: UgLayoutRenderableDirective[] = [];

  constructor(
    @Inject(UG_CONTAINER)
    @SkipSelf()
    @Host()
    _parent: UgLayoutRenderableDirective
  ) {
    super(_parent);
  }

  addChild(child: UgLayoutRenderableDirective): void {
    this._children.push(child);
  }

  abstract getConfig(): ConfiguredRenderable<Row | Column>;
}

@Directive({
  selector: 'ug-layout-row',
  providers: [
    {
      provide: UG_CONTAINER,
      useExisting: forwardRef(() => UgLayoutRowDirective)
    }
  ]
})
export class UgLayoutRowDirective extends UgLayoutXYDirective {
  getConfig(): ConfiguredRenderable<Row> {
    return Row.configure({
      children: this._children.map(child => child.getConfig())
    });
  }
}

@Directive({
  selector: 'ug-layout-column',
  providers: [
    {
      provide: UG_CONTAINER,
      useExisting: forwardRef(() => UgLayoutColumnDirective)
    }
  ]
})
export class UgLayoutColumnDirective extends UgLayoutXYDirective {
  getConfig(): ConfiguredRenderable<Column> {
    return Column.configure({
      children: this._children.map(child => child.getConfig())
    });
  }
}
