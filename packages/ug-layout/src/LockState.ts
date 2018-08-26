import { Subject, Observable, Observer } from 'rxjs';
import { filter, distinctUntilChanged } from 'rxjs/operators';

export const LOCK_DRAGGING = 'dragging';
export const LOCK_RESIZING = 'resizing';

export class LockStateChangeEvent {
  constructor(
    public readonly name: string,
    public readonly value: boolean
  ) {}
}

export class LockState {
  private _map = new Map<string, boolean>();
  private _changes: Subject<LockStateChangeEvent> = new Subject();

  changes: Observable<LockStateChangeEvent> = this._changes.asObservable();

  get isLocked(): boolean {
    return [ ...this._map.values() ].some(Boolean);
  }

  set(name: string, value: boolean): void {
    this._map.set(name, value);
    this._changes.next(new LockStateChangeEvent(name, value));
  }

  get(name: string): boolean {
    return Boolean(this._map.get(name));
  }

  scope(name: string): Observable<boolean> {
    return new Observable((observer: Observer<boolean>) => {
      if (this._map.has(name)) {
        observer.next(this._map.get(name) as boolean);
      }

      return this.changes.pipe(
        filter(e => e.name === name)
      )
        .subscribe(e => observer.next(e.value));
    })
      .pipe(distinctUntilChanged());
  }
}