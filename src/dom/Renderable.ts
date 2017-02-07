import { VNode } from 'snabbdom/vnode';

import { Type } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  AsyncEvent
} from '../events';

export abstract class Renderable {
  onDestroy: Observable<this>;
  onBeforeDestroy: Observable<AsyncEvent<this>>;
  
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _onDestroy: Subject<this> = new Subject();
  protected _onBeforeDestroy: Subject<AsyncEvent<this>> = new Subject();

  constructor(protected _container: Renderable|null = null) {
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

  abstract render(): VNode;
  abstract resize(): void;
  abstract isVisible(): boolean;

  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    
    this._isDestroyed = true;
    this._onDestroy.next(this);

    this._onDestroy.complete();
    this._onBeforeDestroy.complete();
  }

  getParent(Ctor: Type<Renderable>): Renderable|null {
    if (this._container) {
      if (this._container instanceof Ctor) {
        return this._container;
      }
      
      return this._container.getParent(Ctor);
    }  

    return null;
  }

  protected waitForDestroy(): Promise<this>  {
    return Cancellable.dispatch(this._onBeforeDestroy, this).toPromise();
  }
}