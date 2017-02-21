import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di'
import { 
  Subject, 
  Observable, 
  Cancellable,
  BeforeDestroyEvent
} from '../events';
import { TabSelectionEvent } from './TabSelectionEvent';
import { Renderable, ConfiguredRenderable } from '../dom';
import { Draggable } from '../Draggable';
import { ContainerRef, ConfigurationRef, DocumentRef, DragEvent, DragStatus } from '../common';
import { StackHeader } from './StackHeader';
import { TabCloseEvent } from './TabCloseEvent';
import { TabDragEvent } from './TabDragEvent';
import { Stack } from './Stack';
import { StackItemContainer } from './StackItemContainer';
import { DragHost } from '../DragHost';
import { get } from '../utils';
import { TabControl } from './tabControls';

export interface StackTabConfig {
  maxSize: number;
  title: string;
}

export type StackTabConfigArgs = {
  [P in keyof StackTabConfig]?: StackTabConfig[P];
}

export class StackTab extends Renderable {
  private _element: HTMLElement;
  private _isDragging: boolean = false;
  protected _container: StackHeader;
  
  constructor(
    @Inject(ContainerRef) _container: StackHeader,
    @Inject(ConfigurationRef) private _config: StackTabConfig,
    @Inject(Draggable) private _draggable: Draggable<StackTab>,
    @Inject(DragHost) private _dragHost: DragHost,
    @Inject(DocumentRef) private _document: Document,
    @Inject(Injector) _injector: Injector
  ) {
    super(_injector);
    
    this._config = Object.assign({
      maxSize: 150,
      title: ''   
    }, this._config || {});

    this._draggable.drag
      .filter(Draggable.isDraggingEvent)
      .subscribe(this._onDragMove.bind(this));
    
    this._draggable.drag
      .filter(Draggable.isDragStopEvent)
      .subscribe(this._onDragStop.bind(this));
      
    this._draggable.drag
      .filter(Draggable.isDragStartEvent)
      .subscribe(this._onDragStart.bind(this));

    this._dragHost.start
      .takeUntil(this.destroyed)
      .subscribe(this._onDragHostStart.bind(this));
    
    this._dragHost.dropped
      .takeUntil(this.destroyed)
      .subscribe(this._onDragHostDropped.bind(this));
  }
  
  get width(): number {
    return this._container.isHorizontal ? this._width : this._container.width;
  }

  get height(): number {
    return this._container.isHorizontal ? this._container.height : this._height;
  }

  get element(): HTMLElement {
    return this._element;
  }

  get item(): StackItemContainer|null {
    return this._container.getItemFromTab(this);
  }

  get offsetX(): number {
    return this._container.getOffsetXForTab(this);
  }
  
  get offsetY(): number {
    return this._container.getOffsetYForTab(this);
  }

  get isDragging(): boolean {
    return this._isDragging;
  }

  get stack(): Stack|null {
    return (this._container ? this._container.container : null) as Stack|null;
  }

  get controls(): TabControl[] {
    const { item } = this;
    
    return item ? item.controls : [];
  }

  resize(): void {
    if (this._element) {
      const rect = this._element.getBoundingClientRect();

      this._width = rect.width;
      this._height = rect.height;
    }
  }
  
  render(): VNode {
    const { item } = this;
    
    return h(`div.ug-layout__stack-tab`, {
      key: this.uid,
      style: this._getStyles(),
      class: {
        'ug-layout__stack-tab-active': this._container.isTabActive(this),
        'ug-layout__stack-tab-distributed': this._container.isDistributed,
        'ug-layout__stack-tab-x': this._container.isHorizontal,
        'ug-layout__stack-tab-y': !this._container.isHorizontal,
        'ug-layout__stack-tab-draggable': item ? item.draggable : true
      },
      hook: {
        create: (oldNode, newNode) => this._element = newNode.elm as HTMLElement,
        insert: () => this.resize()
      },
      on: {
        mousedown: e => this._onMouseDown(e),
        click: () => this._onClick()
      }
    }, [
      h('div', get(item, 'title', '')),
      h('div.ug-layout__stack-tab-controls', this.controls.filter(c => c.isActive()).map(c => c.render()))
    ]);
  }  

  destroy(): void {
    this._draggable.destroy();
    super.destroy();
  }

  private _getStyles(): { [key: string]: string } {
    let result = {};

    if (this._container.isHorizontal) {
      if (!this._container.isDistributed) {
        result['max-width'] = `${this._config.maxSize}px`;
      }
      
      result['max-height'] = `${this._container.height}px`;
      result['height'] = this.height;
    } else {
      if (!this._container.isDistributed) {
        result['max-height'] = `${this._config.maxSize}px`;
      }
      
      result['max-width'] = `${this._container.width}px`;
      result['width'] = this.width;
    }
    
    return result;
  }

  private _onMouseDown(e: MouseEvent): void {
    const { item } = this;
    
    if (item && !item.draggable) {
      return;  
    }
    
    this._draggable.startDrag({
      host: this, 
      startX: e.x,
      startY: e.y,
      pageX: e.pageX,
      pageY: e.pageY
    });
  }

  private _onDragStart(e: DragEvent<StackTab>): void {
    const item = this._container.getItemFromTab(this);
    const originStack = this.stack;
    const originIndex = this._container.getIndexOf(this);
    
    this._isDragging = true;
    this.emit(new TabDragEvent(this));
    this._element.classList.add('ug-layout__tab-dragging');
    this._document.body.appendChild(this._element);
    
    if (item) {
      this._dragHost.initialize({
        item: <Renderable>item, 
        draggable: this._draggable, 
        dragArea: this.getArea()
      });
      
      this._dragHost.fail
        .takeUntil(this._dragHost.dropped)
        .subscribe(() => {
          if (originStack) {
            originStack.addChild(item, { index: originIndex });
          }
        });
        
      this._dragHost.dropped
        .first()
        .subscribe(() => this.destroy());
    } 
  }

  private _onDragMove(e: DragEvent<StackTab>): void {
    const { bounds } = this._dragHost;

    let x = e.pageX - (this.width / 2);
    let y = e.pageY - (this.height / 2);

    if (bounds) {
      x = bounds.clampX(x);
      y = bounds.clampY(y);
    }
    
    this._element.style.transform = `translateX(${x}px) translateY(${y}px)`;
  }
  
  private _onDragStop(e: DragEvent<StackTab>): void {
    this._isDragging = false;
    this._element.style.transform = `translateX(0px) translateY(0px)`;
    this._element.classList.remove('ug-layout__tab-dragging');
    this._document.body.removeChild(this._element);
  }

  private _onDragHostStart(): void {
    this._element.classList.add('ug-layout__tab-drag-enabled');
  }
  
  private _onDragHostDropped(): void {
    this._element.classList.remove('ug-layout__tab-drag-enabled');
  }

  private _onClick(): void {
    this.emit(new TabSelectionEvent(this));
  }
}