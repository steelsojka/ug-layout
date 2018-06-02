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
  OnDestroy,
  Type
} from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { RootLayout, ProviderArg, Renderable, ConfiguredRenderable, Layout } from 'ug-layout';
import { takeUntil } from 'rxjs/operators';

import { AngularPlugin, AngularPluginConfig } from './AngularPlugin';
import { DestroyNotifyEvent } from './DestroyNotifyEvent';

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
  @Input() destroyNotifier?: Observable<void>;
  @Input() pluginFactory?: (config: AngularPluginConfig) => AngularPlugin;
  @Output() initialized: EventEmitter<RootLayout> = new EventEmitter();

  @ViewChild('container', { read: ViewContainerRef })
  private _viewContainerRef: ViewContainerRef;
  private _isInitialized: boolean = false;
  private _rootLayout: RootLayout;
  private _destroyed: Subject<void> = new Subject<void>();

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
      const pluginConfig = {
        ngInjector: this._injector,
        viewContainerRef: this._viewContainerRef
      };

      const plugin = this.pluginFactory ? this.pluginFactory(pluginConfig) : new AngularPlugin(pluginConfig);

      this._rootLayout = RootLayout.create({
        plugins: [ plugin ],
        container: this._viewContainerRef.element.nativeElement
      });

      this._rootLayout.initialize();
    }

    if (this.destroyNotifier) {
      this.destroyNotifier
        .pipe(takeUntil(this._destroyed))
        .subscribe(() => this._notifyDestroy());
    }

    if (this.config) {
      this._construct(this.config);
    }

    this.initialized.emit(this._rootLayout);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.config
      && changes.config.currentValue instanceof ConfiguredRenderable
      && !changes.config.isFirstChange()) {
      this._construct(changes.config.currentValue);
    }
  }

  ngOnDestroy(): void {
    if (!this.persist) {
      this._rootLayout.destroy();
    }

    this._destroyed.next();
    this._destroyed.complete();
  }

  private _notifyDestroy(): void {
    if (this._rootLayout) {
      this._rootLayout.emitDown(new DestroyNotifyEvent(undefined));
    }
  }

  private _construct(root: ConfiguredRenderable<RootLayout>): void {
    this._rootLayout.load(root);
  }

  static downgrade(): { component: typeof UgLayoutOutletComponent } {
    return { component: UgLayoutOutletComponent };
  }
}