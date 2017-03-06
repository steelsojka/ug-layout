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
import { RootLayout, ProviderArg, Renderable, ConfiguredRenderable, Layout } from 'ug-layout';

import { AngularPlugin } from './AngularPlugin';
import { RootLayoutProviders } from './common';

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
  @Input() root?: ConfiguredRenderable<RootLayout>;

  @ViewChild('container', { read: ViewContainerRef })
  private _viewContainerRef: ViewContainerRef;
  private _isInitialized: boolean = false;
  private _rootLayout: RootLayout;

  constructor(
    @Inject(Injector) private _injector: Injector
  ) {}

  ngOnInit(): void {
    this._rootLayout = RootLayout.create({
      plugins: [
        new AngularPlugin({
          ngInjector: this._injector,
          viewContainerRef: this._viewContainerRef
        })  
      ],
      container: this._viewContainerRef.element.nativeElement
    });

    this._rootLayout.initialize();

    if (this.root) {
      this._construct(this.root);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['root'] 
      && changes['root'].currentValue instanceof ConfiguredRenderable
      && !changes['root'].isFirstChange()) {
      this._construct(changes['root'].currentValue);
    }
  }

  private _construct(root: ConfiguredRenderable<RootLayout>): void {
    this._rootLayout.load(root);
  }
}