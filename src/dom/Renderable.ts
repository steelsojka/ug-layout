import { VNode } from 'snabbdom/vnode';

import { Type } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  AsyncEvent
} from '../events';
import { uid } from '../utils';

export abstract class Renderable {
  onDestroy: Observable<this>;
  onBeforeDestroy: Observable<AsyncEvent<this>>;
  
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _onDestroy: Subject<this> = new Subject();
  protected _onBeforeDestroy: Subject<AsyncEvent<this>> = new Subject();
  protected _uid: number = uid();

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

  get uid(): number {
    return this._uid;
  }

  abstract render(): VNode;
  abstract resize(): void;
  
  makeVisible(): void {
    if (this._container) {
      this._container.makeVisible();
    }
  }

  isVisible(): boolean {
    return Boolean(this._container && this._container.isVisible());
  }
  
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    
    this._isDestroyed = true;
    this._onDestroy.next(this);

    this._onDestroy.complete();
    this._onBeforeDestroy.complete();
  }

  getParent<T extends Renderable>(Ctor: Type<T>): T|null {
    if (this._container) {
      if (this._container instanceof Ctor) {
        return this._container as T;
      }
      
      return this._container.getParent(Ctor);
    }  

    return null;
  }

  getParents<T extends Renderable>(Ctor: Type<T>): T[] {
    let parent: Renderable|null = this;
    let result: T[] = [];

    while (parent = parent.getParent(Ctor)) {
      result.push(parent as T);
    }

    return result;
  }

  protected waitForDestroy(): Promise<this>  {
    return Cancellable.dispatch(this._onBeforeDestroy, this).toPromise();
  }
}