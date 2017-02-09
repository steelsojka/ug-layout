import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject } from './di';
import { Renderable, Renderer } from './dom';
import { DocumentRef, ContainerRef, XYDirection, ConfigurationRef } from './common';
import { XYContainer } from './XYContainer';
import { Observable, ReplaySubject } from './events';
import { DragEvent, Draggable } from './Draggable';

export const SPLITTER_SIZE = 5;

export interface SplitterConfig {
  size: number;
}

export class Splitter extends Renderable {
  dragStatus: Observable<DragEvent<Splitter>>;
  x: number = 0;
  y: number = 0;
  
  private _startX: number = 0;
  private _startY: number = 0;
  private _isDragging: boolean = false;
  private _element: HTMLElement;
  
  constructor(
    @Inject(ConfigurationRef) private _config: SplitterConfig,
    @Inject(DocumentRef) private _document: Document,
    @Inject(Renderer) private _renderer: Renderer,
    @Inject(ContainerRef) protected _container: XYContainer,
    @Inject(Draggable) protected _draggable: Draggable<Splitter>
  ) {
    super(_container);
    
    this.dragStatus = this._draggable.drag;
  }
  
  get height(): number {
    return this._isRow ? this._container.height : this._config.size;
  }

  get width(): number {
    return this._isRow ? this._config.size : this._container.width;
  }

  get size(): number {
    return this._isRow ? this.width : this.height;
  }

  get element(): HTMLElement {
    return this._element;
  }

  private get handleStyles(): { [key:string]: any } {
    if (this._isRow) {
      return {
        height: `${this.height}px`,
        width: `${this.width + 20}px`,
        left: '${this.x - 10}px',
        top: 0
      };
    }
    
    return {
      height: `${this.height + 20}px`,
      width: `${this.width}px`,
      left: 0,
      top: '${this.y - 10}px'
    };
  }

  private get _isRow(): boolean {
    return this._container.isRow;
  }

  dragTo(x = this.x, y = this.y): void {
    this.x = x;
    this.y = y;
    this._element.style.left = `${this.x}px`;
    this._element.style.top = `${this.y}px`;
  }

  render(): VNode {
    const _class = this._isRow ? 'ug-layout__splitter-x' : 'ug-layout__splitter-y';
    
    return h(`div.ug-layout__splitter.${_class}`, {
      key: this.uid,
      style: {
        height: this.height,
        width: this.width,
        left: `${this.x}`,
        top: `${this.y}`
      },
      hook: {
        create: (oldNode, newNode) => this._element = newNode.elm as HTMLElement
      }
    }, [
      h('div.ug-layout__drag-handle', {
        style: this.handleStyles,
        on: {
          mousedown: e => this._onMouseDown(e)
        }
      })
    ]);
  }

  destroy(): void {
    this._draggable.destroy();
    super.destroy();
  }

  private _onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    this._draggable.startDrag(this, e.x, e.y);
  }
}