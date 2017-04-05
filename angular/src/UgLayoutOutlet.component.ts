import { 
  Injector, 
  ViewContainerRef, 
  Inject, 
  Component, 
  Input, 
  Output,
  OnChanges,
  SimpleChanges,
  ViewChild,
  EventEmitter,
  OnDestroy
} from '@angular/core';
import { RootLayout, ProviderArg, Renderable, ConfiguredRenderable, Layout } from 'ug-layout';

import { AngularPlugin } from './AngularPlugin';

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
export class UgLayoutOutletComponent implements OnChanges, OnDestroy {
  @Input() config?: ConfiguredRenderable<RootLayout>;
  @Input() persist?: boolean = false;
  @Input() root?: RootLayout;
  @Output() initialized: EventEmitter<RootLayout> = new EventEmitter();

  @ViewChild('container', { read: ViewContainerRef })
  private _viewContainerRef: ViewContainerRef;
  private _isInitialized: boolean = false;
  private _rootLayout: RootLayout;

  constructor(
    @Inject(Injector) private _injector: Injector
  ) {}

  ngOnInit(): void {
    if (this.root) {
      this._rootLayout = this.root;

      const plugin = this._rootLayout.getPlugins(AngularPlugin)[0] as AngularPlugin|undefined;

      if (!plugin) {
        throw new Error('Missing angular plugin in root layout instance.');
      }

      plugin.setViewContainerRef(this._viewContainerRef);
      plugin.setInjector(this._injector);

      this._rootLayout.setContainingNode(this._viewContainerRef.element.nativeElement);
    } else {
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
    }

    if (this.config) {
      this._construct(this.config);
    }

    this.initialized.emit(this._rootLayout);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['root'] 
      && changes['root'].currentValue instanceof ConfiguredRenderable
      && !changes['root'].isFirstChange()) {
      this._construct(changes['root'].currentValue);
    }
  }

  ngOnDestroy(): void {
    if (!this.persist) {
      this._rootLayout.destroy();
    }
  }

  private _construct(root: ConfiguredRenderable<RootLayout>): void {
    this._rootLayout.load(root);
  }

  static downgrade(): any {
    return {
      component: UgLayoutOutletComponent,
      inputs: [ 'root', 'config', 'persist' ],
      outputs: [ 'initialized' ]
    };
  }
}