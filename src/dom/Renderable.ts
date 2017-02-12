import { VNode } from 'snabbdom/vnode';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

import { Type } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  EventBus,
  BusEvent
} from '../events';
import { uid } from '../utils';

export interface EmitEventOptions {
  recursively?: boolean;
  skipSelf?: boolean;
  direction?: 'up'|'down';
}

export interface Transferable {
  transferred: Observable<Transferable>;
  transferTo(container: Renderable): void;
}

export abstract class Renderable {
  destroyed: Observable<this>;
  containerChange: Observable<Renderable|null>;
  
  protected _eventBus = new EventBus();
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _destroyed: Subject<this> = new Subject();
  protected _uid: number = uid();
  protected _container: Renderable|null = null
  protected _containerChange: Subject<Renderable|null> = new Subject<Renderable|null>();

  constructor(_container: Renderable|null = null) {
    this.destroyed = this._destroyed.asObservable();
    this.containerChange = this._containerChange.asObservable();

    this.setContainer(_container);
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
  }

  getParent<T extends Renderable>(Ctor?: Type<T>): T|null {
    if (this._container) {
      if (!Ctor) {
        return this._container as T;
      }
      
      if (this._container instanceof Ctor) {
        return this._container as T;
      }
      
      return this._container.getParent(Ctor);
    }  

    return null;
  }

  getParents<T extends Renderable>(Ctor?: Type<T>): T[] {
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

  subscribe<T extends BusEvent<any>>(Event: Type<T>, observer: PartialObserver<T>|((event: T) => void)): Subscription {
    return this._eventBus.subscribe(Event, observer);
  }

  emit<T extends BusEvent<any>>(event: T): void {
    this._eventBus.next(event);
  }

  emitDown<T extends BusEvent<any>>(event: T): void {
    for (const child of this.getDescendants()) {
      if (event.isPropagationStopped) {
        break;
      }
      
      child.emit(event);
    }
  }

  emitUp<T extends BusEvent<any>>(event: T): void {
    for (const parent of this.getParents()) {
      if (event.isPropagationStopped) {
        break;
      }
      
      parent.emit(event);
    }
  }

  getDescendants(): Renderable[] {
    const children = this.getChildren();

    return children.reduce((result, child) => {
      return [ ...result, ...child.getDescendants() ]
    }, children);
  }

  scope<T extends BusEvent<any>>(Event: Type<T>): Observable<T> {
    return this._eventBus.scope(Event);
  }
}