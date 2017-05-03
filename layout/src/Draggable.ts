import { Inject } from './di';
import { Subject, Observable } from './events';
import { DocumentRef, DragEvent, DragStatus, DragOptions } from './common';
import { propEq } from './utils';

export class Draggable<T> {
  @Inject(DocumentRef) private _document: Document;
  private _host: T;
  private _drag: Subject<DragEvent<T>> = new Subject();
  private _isDragging: boolean = false;
  private _startX: number = 0;
  private _startY: number = 0;
  private _pastThreshold: boolean = false;
  private _threshold: number = 100;

  drag: Observable<DragEvent<T>> = this._drag.asObservable();

  static isDraggingEvent = propEq('status', DragStatus.DRAGGING);
  static isDragStartEvent = propEq('status', DragStatus.START);
  static isDragStopEvent = propEq('status', DragStatus.STOP);

  constructor() {
    this._onMouseMove = this._onMouseMove.bind(this);
    this._onMouseUp = this._onMouseUp.bind(this);
  }

  get isDragging(): boolean {
    return this._isDragging;
  }

  startDrag(options: DragOptions<T>): void {
    this._host = options.host;
    this._isDragging = true;
    this._startX = options.startX;
    this._startY = options.startY;
    this._threshold = options.threshold || 25;
    this._pastThreshold = false;
    this._document.addEventListener('mousemove', this._onMouseMove, false);
    this._document.addEventListener('mouseup', this._onMouseUp, false);
  }

  destroy(): void {
    this._drag.complete();
  }

  private _onMouseUp(e: MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    this._isDragging = false;
    this._document.removeEventListener('mousemove', this._onMouseMove, false);
    this._document.removeEventListener('mouseup', this._onMouseUp, false);

    if (this._pastThreshold) {
      this._drag.next({
        status: DragStatus.STOP,
        x: e.pageX - this._startX,
        y: e.pageY - this._startY,
        pageY: e.pageY,
        pageX: e.pageX,
        host: this._host
      });
    }
  }

  private _onMouseMove(e: MouseEvent): void {
    if (!this._isDragging) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const deltaX = e.pageX - this._startX;
    const deltaY = e.pageY - this._startY;

    if (!this._pastThreshold && (Math.abs(deltaX) >= this._threshold || Math.abs(deltaY) >= this._threshold)) {
      this._pastThreshold = true;  
      this._drag.next({
        host: this._host,
        status: DragStatus.START,
        x: deltaX,
        y: deltaY,
        pageX: e.pageX,
        pageY: e.pageY
      });
    }
    
    if (this._pastThreshold) {
      this._drag.next({
        status: DragStatus.DRAGGING,
        x: deltaX,
        y: deltaY,
        pageX: e.pageX,
        pageY: e.pageY,
        host: this._host
      });
    }
  }
}