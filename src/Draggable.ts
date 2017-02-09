import { Inject } from './di';
import { ReplaySubject, Observable } from './events';
import { DocumentRef } from './common';

export enum DragStatus {
  START,
  STOP,
  DRAGGING  
}

export interface DragEvent<T> {
  host: T;
  x: number,
  y: number,
  status: DragStatus;
}

export class Draggable<T> {
  drag: Observable<DragEvent<T>>;
  
  private _host: T;
  private _drag: ReplaySubject<DragEvent<T>> = new ReplaySubject(1);
  private _isDragging: boolean = false;
  private _startX: number = 0;
  private _startY: number = 0;

  constructor(
    @Inject(DocumentRef) private _document: Document
  ) {
    this.drag = this._drag.asObservable();
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  get isDragging(): boolean {
    return this._isDragging;
  }

  startDrag(host: T, startX: number, startY: number): void {
    this._host = host;
    this._isDragging = true;
    this._startX = startX;
    this._startY = startY;
    this._document.addEventListener('mousemove', this._onMouseMove, false);
    this._document.addEventListener('mouseup', this._onMouseUp, false);
    this._drag.next({
      host,
      status: DragStatus.START,
      x: this._startX,
      y: this._startY,
    });
  }

  destroy(): void {
    this._drag.complete();
  }

  private _onMouseUp(e: MouseEvent): void {
    this._isDragging = false;
    this._document.removeEventListener('mousemove', this._onMouseMove, false);
    this._document.removeEventListener('mouseup', this._onMouseUp, false);
    this._drag.next({
      status: DragStatus.STOP,
      x: e.x - this._startX,
      y: e.y - this._startY,
      host: this._host
    });
  }

  private _onMouseMove(e: MouseEvent): void {
    if (!this._isDragging) {
      return;
    }

    this._drag.next({
      status: DragStatus.DRAGGING,
      x: e.x - this._startX,
      y: e.y - this._startY,
      host: this._host
    });
  }
}