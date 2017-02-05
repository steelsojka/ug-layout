import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject } from './di';
import { Renderable, Renderer } from './dom';
import { DocumentRef, ContainerRef, XYDirection, ConfigurationRef } from './common';
import { XYContainer } from './XYContainer';
import { Observable, ReplaySubject } from './events';

export const SPLITTER_SIZE = 5;

export interface SplitterConfig {
  size: number;
}

export enum SplitterDragStatus {
  START,
  STOP,
  DRAGGING  
}

export interface SplitterDragEvent {
  splitter: Splitter;
  x: number,
  y: number,
  dragStatus: SplitterDragStatus
}

export class Splitter extends Renderable {
  dragStatus: Observable<SplitterDragEvent>;
  x: number = 0;
  y: number = 0;
  
  private _startX: number = 0;
  private _startY: number = 0;
  private _isDragging: boolean = false;
  private _dragStatus: ReplaySubject<SplitterDragEvent> = new ReplaySubject(1);
  private _element: HTMLElement;
  
  constructor(
    @Inject(ContainerRef) private _container: XYContainer,
    @Inject(ConfigurationRef) private _config: SplitterConfig,
    @Inject(DocumentRef) private _document: Document,
    @Inject(Renderer) private _renderer: Renderer
  ) {
    super();
    
    this.dragStatus = this._dragStatus.asObservable();
    this.onMouseMove = this.onMouseMove.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
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

  resize(): void {}

  dragTo(x = this.x, y = this.y): void {
    this.x = x;
    this.y = y;
    this._element.style.left = `${this.x}px`;
    this._element.style.top = `${this.y}px`;
  }

  render(): VNode {
    const _class = this._isRow ? 'ug-layout__splitter-x' : 'ug-layout__splitter-y';
    
    return h(`div.ug-layout__splitter.${_class}`, {
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
          mousedown: e => this.onMouseDown(e)
        }
      })
    ]);
  }

  destroy(): void {
    this._dragStatus.complete();  
    super.destroy();
  }

  private onMouseMove(e: MouseEvent): void {
    if (!this._isDragging) {
      return;
    }

    this._dragStatus.next({
      dragStatus: SplitterDragStatus.DRAGGING,
      x: e.x - this._startX,
      y: e.y - this._startY,
      splitter: this
    });
  }
  
  private onMouseUp(e: MouseEvent): void {
    this._isDragging = false;
    this._document.removeEventListener('mousemove', this.onMouseMove, false);
    this._document.removeEventListener('mouseup', this.onMouseUp, false);
    this._dragStatus.next({
      dragStatus: SplitterDragStatus.STOP,
      x: e.x - this._startX,
      y: e.y - this._startY,
      splitter: this
    });
  }

  private onMouseDown(e: MouseEvent): void {
    e.preventDefault();
    
    this._isDragging = true;
    this._startX = e.x;
    this._startY = e.y;
    this._document.addEventListener('mousemove', this.onMouseMove, false);
    this._document.addEventListener('mouseup', this.onMouseUp, false);
    this._dragStatus.next({
      dragStatus: SplitterDragStatus.START,
      x: this._startX,
      y: this._startY,
      splitter: this
    });
  }
}