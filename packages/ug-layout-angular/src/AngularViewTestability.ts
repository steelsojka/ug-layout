import {
  Subject,
  merge,
  combineLatest
} from 'rxjs';
import { takeUntil, distinctUntilChanged, startWith } from 'rxjs/operators';
import { RootLayout, ViewManager, ViewContainer } from 'ug-layout';

/**
 * Class used for protractor testing.
 * @export
 * @class AngularViewTestability
 */
export class AngularViewTestability {
  private _layout: RootLayout | null = null;
  private _isStable: boolean = true;
  private _layoutSource = new Subject<RootLayout | null>();
  private _pendingUpdate = new Subject<ViewContainer<any>[]>();
  private _destroyed = new Subject();
  private _pending: ViewContainer<any>[] = [];
  private _clearSubscriptions = merge(
    this._destroyed.asObservable(),
    this._layoutSource.asObservable());

  constructor(layout?: RootLayout | null) {
    this._layoutSource.subscribe(layoutOrNull => this.layoutChanged(layoutOrNull));

    if (layout) {
      this.setLayout(layout);
    }
  }

  setLayout(layout: RootLayout | null): void {
    this._layoutSource.next(layout);
  }

  isStable(): boolean {
    return this._pending.length === 0;
  }

  whenStable(callback: Function): void {
    if (this.isStable()) {
      return callback();
    }
  }

  findProviders(using: any, provider: string, exactMatch: boolean): any[] {
    return [];
  }

  destroy(): void {
    this._destroyed.next();
    this._layoutSource.complete();
    this._pendingUpdate.complete();
    this._destroyed.complete();
  }

  private remove(container: ViewContainer<any>): void {
    const index = this._pending.indexOf(container);

    if (index !== -1) {
      this._pending.splice(index, 1);
      this._pendingUpdate.next(this._pending);
    }
  }

  private add(container: ViewContainer<any>): void {
    if (this._pending.indexOf(container) === -1) {
      this._pending.push(container);
      this._pendingUpdate.next(this._pending);
    }
  }

  private clear(): void {
    this._pending = [];
    this._pendingUpdate.next(this._pending);
  }

  private layoutChanged(layoutOrNull: RootLayout | null): void {
    this.clear();

    if (!layoutOrNull) {
      return;
    }


    const viewManager = layoutOrNull.injector.get(ViewManager);

    for (const container of viewManager.entries()) {
      this.subscribeToContainerEvents(container);
    }

    viewManager.registered.pipe(
      takeUntil(this._clearSubscriptions)
    )
      .subscribe(({ container }) => this.subscribeToContainerEvents(container));

    viewManager.unregistered.pipe(
      takeUntil(this._clearSubscriptions)
    )
      .subscribe(({ container }) => this.remove(container));
  }

  private subscribeToContainerEvents(container: ViewContainer<any>): void {
    combineLatest(
      container.visibilityChanges.pipe(distinctUntilChanged()),
      container.componentInitialized.pipe(distinctUntilChanged()),
      // Emit initially so combine latest doesn't wait for attach events.
      merge(container.attached, container.detached)
        .pipe(
          startWith(true),
          distinctUntilChanged()))
      .pipe(
        takeUntil(this._clearSubscriptions))
      .subscribe(([ isVisible, isInitialized ]) => {
        if (isVisible && !isInitialized && container.isAttached) {
          this.add(container);
        } else {
          this.remove(container);
        }
      });
  }
}