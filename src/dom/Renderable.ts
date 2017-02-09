import { VNode } from 'snabbdom/vnode';

import { Type } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  AsyncEvent
} from '../events';
import { uid } from '../utils';

export interface Transferable {
  transferred: Observable<Transferable>;
  transferTo(container: Renderable): void;
}

export abstract class Renderable {
  destroyed: Observable<this>;
  beforeDestroy: Observable<AsyncEvent<this>>;
  
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _destroyed: Subject<this> = new Subject();
  protected _beforeDestroy: Subject<AsyncEvent<this>> = new Subject();
  protected _uid: number = uid();

  constructor(protected _container: Renderable|null = null) {
    this.destroyed = this._destroyed.asObservable();

    if (this._container) {
      this.beforeDestroy = Observable.merge(this._beforeDestroy, this._container.beforeDestroy.map(e => AsyncEvent.transfer(e, this)));
    } else {
      this.beforeDestroy = this._beforeDestroy.asObservable();
    }
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
  
  resize(): void {
    for (const child of this.getChildren()) {
      child.resize();
    }
  }
  
  getChildren(): Renderable[] {
    return [];
  }
  
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
    this._destroyed.next(this);

    this._destroyed.complete();
    this._beforeDestroy.complete();
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
    return Cancellable.dispatch(this._beforeDestroy, this).toPromise();
  }
}