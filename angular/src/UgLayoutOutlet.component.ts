import { 
  Injector, 
  ViewContainerRef, 
  Inject, 
  Component, 
  Input, 
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { ProviderArg, Renderable, ConfiguredRenderable, Layout } from 'ug-layout';

import { RootLayoutProviders } from './common';
import { AngularRootLayout } from './RootLayout';

@Component({
  selector: 'ug-layout-outlet',
  template: `<div #container></div>`,
  styles: [`
    :host > div {
      height: 100%;
      width: 100%;
    }
  `]
})
export class UgLayoutOutletComponent implements OnChanges {
  @Input() root?: Renderable;

  @ViewChild('container', { read: ViewContainerRef })
  private _viewContainerRef: ViewContainerRef;
  private _rootLayout: AngularRootLayout;

  constructor(
    @Inject(RootLayoutProviders) private _layoutProviders: ProviderArg[],
    @Inject(Injector) private _injector: Injector
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['root'] && changes['root'].currentValue instanceof ConfiguredRenderable) {
      this._construct(changes['root'].currentValue);
    }
  }

  private _construct(root: ConfiguredRenderable<Layout>): void {
    if (this._rootLayout) {
      this._rootLayout.destroy();
    }
    
    this._rootLayout = AngularRootLayout
      .create({
        ngInjector: this._injector,
        viewContainerRef: this._viewContainerRef,
        container: this._viewContainerRef.element.nativeElement,
        providers: this._layoutProviders
      })
      .configure({ use: root })
      .initialize();
  }
}