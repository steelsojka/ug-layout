import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import {
  RootLayout,
  ViewManager,
  ViewContainerStatus,
  ViewContainer
} from 'ug-layout';

import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/takeUntil';
import 'rxjs/add/operator/first';
import 'rxjs/add/operator/distinctUntilChanged';

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

    this._pendingUpdate
      .first(pending => pending.length === 0, undefined, true)
      .subscribe(() => callback());
  }

  findProviders(using: any, provider: string, exactMatch: boolean): any[] {
    return [];
  }

  destroy(): void {
    this._destroyed.next();
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

  private layoutChanged(layoutOrNull: RootLayout | null): void {
    if (!layoutOrNull) {
      return;
    }

    const viewManager = layoutOrNull.injector.get(ViewManager);

    for (const container of viewManager.entries()) {
      this.subscribeToContainerEvents(container);
    }

    viewManager.registered
      .takeUntil(this._layoutSource.asObservable())
      .subscribe(({ container }) => this.subscribeToContainerEvents(container));

    viewManager.unregistered
      .takeUntil(this._layoutSource.asObservable())
      .subscribe(({ container }) => this.remove(container));
  }

  private subscribeToContainerEvents(container: ViewContainer<any>): void {
    Observable.combineLatest(
      container.visibilityChanges.distinctUntilChanged(),
      container.componentInitialized.distinctUntilChanged(),
      container.attached.distinctUntilChanged()
    )
      .takeUntil(this._destroyed)
      .subscribe(([ isVisible, isInitialized, isAttached ]) => {
        if (isVisible && isInitialized && isAttached) {
          this.add(container);
        } else {
          this.remove(container);
        }
      });
  }

}