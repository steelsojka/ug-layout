import {
  Directive,
  InjectionToken,
  forwardRef,
  Inject,
  ElementRef,
  OnInit,
  AfterViewInit
} from '@angular/core';
import {
  RootLayout,
  Layout,
  RootLayoutConfig
} from 'ug-layout';

import { UgLayoutRenderableDirective, UG_CONTAINER } from './UgLayoutRenderable.directive';

export const UG_ROOT_CONTAINER = new InjectionToken<UgLayoutDirective>('UG_ROOT_CONTAINER');

@Directive({
  selector: 'ug-layout',
  providers: [
    { provide: UG_ROOT_CONTAINER, useExisting: forwardRef(() => UgLayoutDirective) },
    { provide: UG_CONTAINER, useExisting: forwardRef(() => UgLayoutDirective) }
  ]
})
export class UgLayoutDirective extends UgLayoutRenderableDirective implements OnInit, AfterViewInit {
  private _child: UgLayoutRenderableDirective;
  private _root: RootLayout;

  constructor(
    @Inject(ElementRef) private _elementRef: ElementRef
  ) {
    super();
  }

  addChild(child: UgLayoutRenderableDirective): void {
    this._child = child;
  }

  ngOnInit(): void {
    this._root = RootLayout.create({
      container: this._elementRef.nativeElement  
    });
  }

  ngAfterViewInit(): void {
    this._root.load(this.getConfig());
  }

  getConfig(): RootLayoutConfig {
    return {
      use: this._child.getConfig()   
    };
  }
}