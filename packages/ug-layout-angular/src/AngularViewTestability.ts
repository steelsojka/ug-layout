import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { RootLayout, ViewManager, ViewContainerStatus } from 'ug-layout';

import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/takeUntil';

export class AngularViewTestability {
  private _layout: RootLayout | null = null;
  private _isStable: boolean = true;
  private _checking = new Subject();

  constructor(layout?: RootLayout | null) {
    if (layout) {
      this.setLayout(layout);
    }
  }

  setLayout(layout: RootLayout | null): void {
    this._layout = layout;
  }

  isStable(): boolean {
    return this._isStable;
  }

  whenStable(callback: Function): void {
    this._isStable = false;
    this._checking.next();

    if (!this._layout) {
      return callback();
    }

    const viewManager = this._layout.injector.get(ViewManager);

    Observable.forkJoin(
      ...[ ...viewManager.entries() ]
        .filter(view => view.isVisible)
        .map(view => view.status
          .first(status => status === ViewContainerStatus.READY, undefined, true))
    )
      .takeUntil(this._checking)
      .subscribe(() => {
        this._isStable = true;
        callback();
      });
  }

  findProviders(using: any, provider: string, exactMatch: boolean): any[] {
    return [];
  }
}