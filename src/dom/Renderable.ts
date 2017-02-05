import { VNode } from 'snabbdom/vnode';

import { 
  Observable, 
  Subject, 
  Cancellable,
  AsyncEvent
} from '../events';

export abstract class Renderable {
  onDestroy: Observable<Renderable>;
  onBeforeDestroy: Observable<AsyncEvent<Renderable>>;
  
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _onDestroy: Subject<Renderable> = new Subject();
  protected _onBeforeDestroy: Subject<AsyncEvent<Renderable>> = new Subject();

  constructor() {
    this.onDestroy = this._onDestroy.asObservable();
    this.onBeforeDestroy = this._onBeforeDestroy.asObservable();
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._width;
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  abstract render(): VNode
  abstract resize(): void

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    
    this._isDestroyed = true;
    this._onDestroy.next(this);

    this._onDestroy.complete();
    this._onBeforeDestroy.complete();
  }

  protected waitForDestroy(): Promise<Renderable>  {
    return Cancellable.dispatch(this._onBeforeDestroy, this).toPromise();
  }
}