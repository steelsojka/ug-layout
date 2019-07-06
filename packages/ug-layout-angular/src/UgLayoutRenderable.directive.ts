import { InjectionToken, OnInit } from '@angular/core';

export const UG_CONTAINER = new InjectionToken<UgLayoutRenderableDirective>(
  'UG_CONTAINER'
);

export abstract class UgLayoutRenderableDirective implements OnInit {
  constructor(private _parent?: UgLayoutRenderableDirective) {}

  abstract addChild(child: UgLayoutRenderableDirective): void;
  abstract getConfig(): any;

  ngOnInit(): void {
    if (this._parent) {
      this._parent.addChild(this);
    }
  }
}
