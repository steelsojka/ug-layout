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
import { Draggable, DragEvent, DragStatus } from '../Draggable';
import { ContainerRef, ConfigurationRef } from '../common';
import { StackHeader } from './StackHeader';
import { Stack } from './Stack';
import { DragHost } from '../DragHost';

export interface StackTabConfig {
  maxSize: number;
  title: string;
}

export type StackTabConfigArgs = {
  [P in keyof StackTabConfig]?: StackTabConfig[P];
}

export class StackTab extends Renderable {
  private _element: HTMLElement;
  protected _container: StackHeader;
  
  constructor(
    @Inject(ContainerRef) _container: StackHeader,
    @Inject(ConfigurationRef) private _config: StackTabConfig,
    @Inject(Draggable) private _draggable: Draggable<StackTab>,
    @Inject(DragHost) private _dragHost: DragHost
  ) {
    super(_container);
    
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
  }
  
  get width(): number {
    return this._container.isHorizontal ? Number.MAX_SAFE_INTEGER : this._container.width;
  }

  get height(): number {
    return this._container.isHorizontal ? this._container.height : Number.MAX_SAFE_INTEGER;
  }
  
  render(): VNode {
    return h(`div.ug-layout__stack-tab`, {
      style: this._getStyles(),
      class: {
        'ug-layout__stack-tab-active': this._container.isTabActive(this),
        'ug-layout__stack-tab-distributed': this._container.isDistributed,
        'ug-layout__stack-tab-x': this._container.isHorizontal,
        'ug-layout__stack-tab-y': !this._container.isHorizontal
      },
      hook: {
        create: (oldNode, newNode) => this._element = newNode.elm as HTMLElement
      },
      on: {
        mousedown: e => this._onMouseDown(e),
        click: () => this._onClick()
      }
    }, [
      h('div', this._config.title),
      h('div.ug-layout__stack-tab-close', {
        on: {
          click: e => this._onClose(e)
        }  
      }, 'x')
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
    } else {
      if (!this._container.isDistributed) {
        result['max-height'] = `${this._config.maxSize}px`;
      }
      
      result['max-width'] = `${this._container.width}px`;
    }
    
    return result;
  }

  private _onMouseDown(e: MouseEvent): void {
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
    
    if (item) {
      this._dragHost.initialize(item, this._draggable);
    } 

    this._element.classList.add('ug-layout__tab-dragging');
  }

  private _onDragMove(e: DragEvent<StackTab>): void {
    this._element.style.left = `${e.x}px`;
    this._element.style.top = `${e.y}px`;
  }
  
  private _onDragStop(e: DragEvent<StackTab>): void {
    this._element.style.left = '0px';
    this._element.style.top = '0px';
    this._element.classList.remove('ug-layout__tab-dragging');
  }

  private _onClose(e: MouseEvent): void {
    e.stopPropagation();

    const event = new BeforeDestroyEvent(this);

    this._eventBus.next(event);
    event.results().subscribe(() => this.destroy());
  }

  private _onClick(): void {
    this._eventBus.next(new TabSelectionEvent(this));
  }
}