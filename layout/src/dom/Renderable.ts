import { VNode } from 'snabbdom/vnode';
import { PartialObserver } from 'rxjs/Observer';
import { Subscription } from 'rxjs/Subscription';
import { CompleteOn } from 'rx-decorators/completeOn';

import { 
  Type, 
  Injector, 
  ProviderArg, 
  PostConstruct,
  Inject
} from '../di';
import { 
  Observable, 
  Subject, 
  Cancellable,
  EventBus,
  BusEvent
} from '../events';
import { clamp, negate, uid, isNumber, get } from '../utils';
import { ContainerRef, RenderableArg, ConfigurationRef } from '../common';
import { RenderableArea } from './RenderableArea';
import { Renderer } from './Renderer';
import { INJECTOR_KEY, RenderableInjector } from './RenderableInjector';
import { ConfiguredRenderable } from './ConfiguredRenderable';
import { RenderableConfig } from './common';
import { BaseSerializerArg } from '../serialization';

export interface BaseModificationArgs {
  /**
   * Whether to invoke the render cycle. This is useful for
   * delaying the render cycle to a later time.
   * @type {boolean}
   */
  render?: boolean;
}

/**
 * Args used when removing a child renderable.
 * @export
 * @interface RemoveChildArgs
 * @extends {BaseModificationArgs}
 */
export interface RemoveChildArgs extends BaseModificationArgs {
  /**
   * Whether to destroy the child being removed.
   * @type {boolean}
   */
  destroy?: boolean;
}

/**
 * Args used when adding a child renderable.
 * @export
 * @interface AddChildArgs
 * @extends {BaseModificationArgs}
 */
export interface AddChildArgs extends BaseModificationArgs {
  /**
   * What index to add the child renderable to. If not provided then
   * it will be pushed.
   * @type {number}
   */
  index?: number;
  /**
   * Whether to invoke a resize of this renderable.
   * @type {boolean}
   */
  resize?: boolean;
}

/**
 * The base renderable that all other renderables extend from.
 * @export
 * @abstract
 * @class Renderable
 */
export abstract class Renderable {
  /**
   * Notifies when this renderable is destroyed.
   * @type {Observable<this>}
   */
  destroyed: Observable<this>;
  /**
   * Notifies when the container of this renderable changes.
   * @type {(Observable<Renderable|null>)}
   */
  containerChange: Observable<Renderable|null>;
  
  tags: Set<string> = new Set<string>();
  
  protected _eventBus = new EventBus();
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;
  protected _uid: number = uid();
  protected _container: Renderable|null;

  @CompleteOn('destroy')
  protected _destroyed: Subject<this> = new Subject();

  @CompleteOn('destroy')
  protected _containerChange: Subject<Renderable|null> = new Subject<Renderable|null>();
  protected _contentItems: Renderable[] = [];

  @Inject(Renderer) protected _renderer: Renderer;
  @Inject(Injector) protected _injector: Injector;

  constructor() {
    this.destroyed = this._destroyed.asObservable();
    this.containerChange = this._containerChange.asObservable();
  }

  /**
   * This renderables container or null if none.
   * @readonly
   * @type {(Renderable|null)}
   */
  get container(): Renderable|null {
    return this._container || null;
  }

  /**
   * This renderables width in pixels.
   * @readonly
   * @type {number}
   */
  get width(): number {
    return this._width;
  }

  /**
   * This renderables height in pixels.
   * @readonly
   * @type {number}
   */
  get height(): number {
    return this._height;
  }

  /**
   * This renderables page offset x.
   * @readonly
   * @type {number}
   */
  get offsetX(): number {
    return get(this._container, 'offsetX', 0, negate(isNumber));
  }

  /**
   * This renderables page offset y.
   * @readonly
   * @type {number}
   */
  get offsetY(): number {
    return get(this._container, 'offsetY', 0, negate(isNumber));
  }

  /**
   * Whether this renderable is destroyed.
   * @readonly
   * @type {boolean}
   */
  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  /**
   * A unique identifier for this renderable.
   * @readonly
   * @type {number}
   */
  get uid(): number {
    return this._uid;
  }

  /**
   * The amount of content items belonging to this renderable.
   * @readonly
   * @type {number}
   */
  get length(): number {
    return this._contentItems.length;
  }

  /**
   * The injector used to create this renderable.
   * @readonly
   * @type {Injector}
   */
  get injector(): Injector {
    if (!this._injector) {
      throw new Error('Trying to access injector before it is set. Did you create his renderable through a RenderableInjector?');
    }
    
    return this._injector;
  }

  get contentItems(): Renderable[] {
    return [ ...this._contentItems ];
  }
  
  /**
   * Creates this renderables VNode for diffing against the previous VNode state.
   * @abstract
   * @returns {VNode} 
   */
  abstract render(): VNode;

  /**
   * Invoked when the Injector has been assigned and ready for use.
   */
  @PostConstruct()
  initialize(): void {
    this.setContainer(this.injector.get<Renderable|null>(ContainerRef, null));
    
    const config = this.injector.get(ConfigurationRef, null) as RenderableConfig|null;

    if (config && Array.isArray(config.tags)) {
      config.tags.forEach(tag => this.tags.add(tag));
    }
  }
  
  /**
   * Sets this components size and triggers it's childrens sizing.
   */
  resize(): void {
    for (const child of this.getChildren()) {
      child.resize();
    }
  }
  
  /**
   * Returns this renderables children renderables. This differs
   * from content items as children should contain all renderables
   * we want as part of the render cycle.
   * @returns {Renderable[]} 
   */
  getChildren(): Renderable[] {
    return [ ...this._contentItems ];
  }

  /**
   * Determines whether this renderable is visible.
   * @returns {boolean} 
   */
  isVisible(): boolean {
    return Boolean(this._container && this._container.isVisible());
  }
  
  /**
   * Destroys this renderable and all it's children.
   * @returns {void} 
   */
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

  /**
   * Gets this renderables parent or any parent that is
   * an instance of the passed in constructor. If non is found
   * then null is returned.
   * @template T The constructor type.
   * @param {Type<T>} [Ctor] 
   * @returns {(T|null)} 
   */
  getParent<T extends Renderable>(Ctor?: Type<T>|Type<T>[]): T|null {
    if (this._container) {
      if (!Ctor) {
        return this._container as T;
      }
      
      if (this._matchesRenderable(this._container, Ctor)) {
        return this._container as T;
      }
      
      return this._container.getParent(Ctor);
    }  

    return null;
  }

  /**
   * Gets this renderables parents or any parents that are
   * an instance of the passed in constructor.    
   * @template T The constructor type.
   * @param {Type<T>} [Ctor] 
   * @returns {(T|null)} 
   */
  getParents<T extends Renderable>(Ctor?: Type<T>|Type<T>[]): T[] {
    let parent: Renderable|null = this;
    let result: T[] = [];

    while (parent = parent.getParent(Ctor)) {
      result.push(parent as T);
    }

    return result;
  }

  /**
   * Sets the container of this renderable.
   * @param {(Renderable|null)} container 
   */
  setContainer(container: Renderable|null): void {
    this._container = container;

    if (this._container) {
      this.injector.setParent(this._container.injector);
    }
    
    this._containerChange.next(container);
  }

  /**
   * Subscribes to a BusEvent.
   * @template T The event type.
   * @param {Type<T>} Event 
   * @param {PartialObserver<T>|function(event: T)} observer 
   * @returns {Subscription} 
   */
  subscribe<T extends BusEvent<any>>(Event: Type<T>, observer: PartialObserver<T>|((event: T) => void)): Subscription {
    return this._eventBus.subscribe(Event, observer);
  }

  /**
   * Emits a BusEvent on this renderable.
   * @template T The event type.
   * @param {T} event 
   */
  emit<T extends BusEvent<any>>(event: T): void {
    this._eventBus.next(event);
  }

  /**
   * Emits a BusEvent down to all descendants recursively.
   * Propagation can be stopped by any descending renderable.
   * @template T The event type.
   * @param {T} event 
   */
  emitDown<T extends BusEvent<any>>(event: T): void {
    for (const child of this.getDescendants()) {
      if (event.isPropagationStopped) {
        break;
      }
      
      child.emit(event);
    }
  }

  /**
   * Emits a BusEvent up to all parents recursively.
   * Propagation can be stopped by any parent renderable.
   * @template T The event type.
   * @param {T} event 
   */
  emitUp<T extends BusEvent<any>>(event: T): void {
    for (const parent of this.getParents()) {
      if (event.isPropagationStopped) {
        break;
      }
      
      parent.emit(event);
    }
  }

  /**
   * Gets all descendants of this renderable recursively.
   * @returns {Renderable[]} 
   */
  getDescendants(): Renderable[] {
    const children = this.getChildren();

    return children.reduce((result, child) => {
      return [ ...result, ...child.getDescendants() ]
    }, children);
  }

  /**
   * Replaces a content item on this renderable with another content item.
   * @param {Renderable} item 
   * @param {Renderable} withItem 
   * @param {RemoveChildArgs} [options={}] 
   */
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

  /**
   * Adds a child item to this renderable.
   * @param {Renderable} item 
   * @param {AddChildArgs} [options={}] 
   */
  addChild(item: Renderable, options: AddChildArgs = {}): void {
    const { index = -1, render = true, resize = true } = options;
    
    if (index === -1) {
      this._contentItems.push(item);
    } else {
      this._contentItems.splice(clamp(index, 0, this._contentItems.length), 0, item);
    }

    item.setContainer(this);

    if (resize) {
      this.resize();
    }

    if (render) {
      this._renderer.render();
    }
  }

  /**
   * Removes a content item from this renderable.
   * @param {Renderable} item 
   * @param {RemoveChildArgs} [options={}] 
   */
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
      // If there are no more content items remove this item from the parent.
      this.remove();
    }

    if (render) {
      this._renderer.render();
    }
  }

  /**
   * Removes this item from it's parent. If there is no
   * parent then this renderable will just be destroyed.
   */
  remove(): void {
    if (this._container) {
      this._container.removeChild(this);
    } else {
      this.destroy();
    }
  }

  /**
   * Gets the index of a content renderable.
   * @param {Renderable} item 
   * @returns {number} 
   */
  getIndexOf(item: Renderable): number {
    return this._contentItems.indexOf(item);
  }

  /**
   * Gets a content renderable at an index.
   * @param {number} index 
   * @returns {(Renderable|null)} 
   */
  getAtIndex(index: number): Renderable|null {
    return this._contentItems[index] || null;
  }

  /**
   * Creates an Observable scoped to a specific event type. 
   * @template T The event type.
   * @param {Type<T>} Event 
   * @returns {Observable<T>} 
   */
  scope<T extends BusEvent<any>>(Event: Type<T>): Observable<T> {
    return this._eventBus.scope(Event);
  }

  /**
   * Whether a renderable is a descendant of this renderable.
   * @param {Renderable} item 
   * @returns {boolean} 
   */
  contains(item: Renderable): boolean {
    return this.getDescendants().indexOf(item) !== -1;
  }
  
  /**
   * Whether this renderable is a descendant of another renderable.
   * @param {Renderable} item 
   * @returns {boolean} 
   */
  isContainedWithin(item: Renderable): boolean {
    return item.contains(this);
  }

  /**
   * Gets the renderable area of this renderable.
   * @returns {RenderableArea} 
   */
  getArea(): RenderableArea {
    const { height, width, offsetX, offsetY } = this;
    
    return new RenderableArea(offsetX, offsetX + width, offsetY, offsetY + height);
  }

  /**
   * Creates a child renderable using this renderable as it's container.
   * @template T 
   * @param {RenderableArg<T>} renderable 
   * @param {ProviderArg[]} [providers=[]] 
   * @returns {T} 
   */
  createChild<T extends Renderable>(renderable: RenderableArg<T>, providers: ProviderArg[] = []): T {
    return RenderableInjector.fromRenderable(
      renderable,
      [
        { provide: ContainerRef, useValue: this },
        ...providers
      ],
      this.injector
    )
      .get<T>(ConfiguredRenderable as any);
  }

  /**
   * Handles any cleanup from a drop.
   */
  handleDropCleanup(): void {}

  getMinimizedSize(): number {
    return 0;
  }

  /**
   * Returns a serializer, serializer class or a configured serializer specifically for this renderable.
   * @returns {(BaseSerializerArg | null)} 
   */
  getSerializer(): BaseSerializerArg | null {
    return null;
  }

  /**
   * Whether this renderable can be dropped on.
   * @param {Renderable} target 
   * @returns {boolean} 
   */
  isDroppable(target: Renderable): boolean {
    return false;
  }

  protected _matchesRenderable<T extends Renderable>(instance: T, query: Type<T>|Type<T>[]): boolean {
    const matches = q => instance instanceof q;

    return Array.isArray(query) ? query.some(matches) : matches(query);
  }
}