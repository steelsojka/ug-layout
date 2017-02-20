import { VNode } from 'snabbdom/vnode';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';

import { Type, Injector } from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  EventBus,
  BusEvent
} from '../events';
import { uid, isNumber } from '../utils';
import { ContainerRef } from '../common';
import { RenderableArea } from './RenderableArea';
import { Renderer } from './Renderer';

export interface BaseModificationArgs {
  render?: boolean;
}

export interface RemoveChildArgs extends BaseModificationArgs {
  destroy?: boolean;
}

export interface AddChildArgs extends BaseModificationArgs {
  index?: number;
  resize?: boolean;
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
  protected _container: Renderable|null;
  protected _containerChange: Subject<Renderable|null> = new Subject<Renderable|null>();
  protected _contentItems: Renderable[] = [];
  protected _renderer: Renderer;

  constructor(protected _injector: Injector) {
    this.destroyed = this._destroyed.asObservable();
    this.containerChange = this._containerChange.asObservable();

    this._renderer = this._injector.get(Renderer);
    this.setContainer(this._injector.get(ContainerRef, null));
  }

  get container(): Renderable|null {
    return this._container || null;
  }

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._width;
  }

  get offsetX(): number {
    return this._container ? this._container.offsetX : 0;
  }

  get offsetY(): number {
    return this._container ? this._container.offsetY : 0;
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  get uid(): number {
    return this._uid;
  }

  get length(): number {
    return this._contentItems.length;
  }

  get injector(): Injector {
    return this._injector;
  }

  abstract render(): VNode;
  
  resize(): void {
    for (const child of this.getChildren()) {
      child.resize();
    }
  }
  
  getChildren(): Renderable[] {
    return [ ...this._contentItems ];
  }

  isVisible(): boolean {
    return Boolean(this._container && this._container.isVisible());
  }
  
  destroy(): void {
    if (this._isDestroyed) {
      return;
    }
    
    for (const item of this._contentItems) {
      item.destroy();  
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

    if (this._container) {
      this._injector.setParent(this._container._injector);
    }
    
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

  replaceChild(item: Renderable, withItem: Renderable, options: RemoveChildArgs = {}): void {
    const { destroy = false, render = true } = options;
    const index = this._contentItems.indexOf(item);

    if (index !== -1) {
      if (destroy) {
        item.destroy();
      }

      this._contentItems.splice(index, 1, withItem);
      withItem.setContainer(this);
      this.resize();

      if (render) {
        this._renderer.render();
      }
    }
  }

  addChild(item: Renderable, options: AddChildArgs = {}): void {
    const { index = -1, render = true, resize = true } = options;
    
    if (index === -1) {
      this._contentItems.push(item);
    } else {
      this._contentItems.splice(index, 0, item);
    }

    item.setContainer(this);

    if (resize) {
      this.resize();
    }

    if (render) {
      this._renderer.render();
    }
  }

  removeChild(item: Renderable, options: RemoveChildArgs = {}): void {
    const { destroy = true, render = true } = options;
    const index = this._contentItems.indexOf(item);

    if (index === -1) {
      return;
    }

    if (destroy) {
      item.destroy();
    }

    this._contentItems.splice(index, 1);

    if (this._contentItems.length) {
      this.resize();
    } else {
      this.remove();
    }

    if (render) {
      this._renderer.render();
    }
  }

  remove(): void {
    if (this._container) {
      this._container.removeChild(this);
    } else {
      this.destroy();
    }
  }

  getIndexOf(item: Renderable): number {
    return this._contentItems.indexOf(item);
  }

  getAtIndex(index: number): Renderable|null {
    return this._contentItems[index] || null;
  }

  scope<T extends BusEvent<any>>(Event: Type<T>): Observable<T> {
    return this._eventBus.scope(Event);
  }

  contains(item: Renderable): boolean {
    return this.getDescendants().indexOf(item) !== -1;
  }
  
  isContainedWithin(item: Renderable): boolean {
    return item.getDescendants().indexOf(this) !== -1;
  }

  getArea(): RenderableArea {
    const { height, width, offsetX, offsetY } = this;
    
    return new RenderableArea(offsetX, offsetX + width, offsetY, offsetY + height);
  }

  handleDropCleanup(): void {}

  isDroppable(target: Renderable): boolean {
    return false;
  }
}