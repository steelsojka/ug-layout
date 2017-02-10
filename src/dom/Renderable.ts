import { VNode } from 'snabbdom/vnode';

import { Type } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable
} from '../events';
import { uid } from '../utils';

export interface Transferable {
  transferred: Observable<Transferable>;
  transferTo(container: Renderable): void;
}

export abstract class Renderable {
  destroyed: Observable<this>;
  beforeDestroy: Observable<Cancellable<Renderable>>;
  containerChange: Observable<Renderable|null>;
  
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _destroyed: Subject<this> = new Subject();
  protected _beforeDestroy: Subject<Cancellable<Renderable>> = new Subject();
  protected _uid: number = uid();
  protected _container: Renderable|null = null
  protected _containerChange: Subject<Renderable|null> = new Subject<Renderable|null>();

  constructor(_container: Renderable|null = null) {
    this.destroyed = this._destroyed.asObservable();
    this.beforeDestroy = this._beforeDestroy.asObservable();
    this.containerChange = this._containerChange.asObservable();
    this.setContainer(_container);

    this.containerChange.subscribe(container => {
      if (container) {
        container.beforeDestroy
          .takeUntil(this.containerChange)
          .subscribe(e => this._beforeDestroy.next(e));
      }
    });
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

  setContainer(container: Renderable|null): void {
    this._container = container;
    this._containerChange.next(container);
  }

  protected waitForDestroy(): Observable<this>  {
    return Cancellable.dispatch(this._beforeDestroy, this);
  }
}