import { Inject } from './di';
import { DocumentRef } from './common';
import { Renderable, RenderableArea } from './dom';
import { Observable, Subject } from './events';
import { Draggable, DragStatus, DragEvent } from './Draggable';

type DropArea = { item: Renderable, area: RenderableArea };

export interface DragAreaBounds {
  x: number; 
  x2: number; 
  y: number; 
  y2: number;
}

export class DragHost {
  dropped: Observable<Renderable>;
  start: Observable<Renderable>;
  
  private _item: Renderable;
  private _dropped: Subject<Renderable> = new Subject();
  private _start: Subject<Renderable> = new Subject();
  private _areas: DropArea[]|null = null;
  private _dropArea: DropArea|null = null;
  private _element: HTMLElement = this._document.createElement('div');
  private _bounds: DragAreaBounds|null = null;

  get bounds(): DragAreaBounds|null {
    return this._bounds;
  }

  constructor(
    @Inject(DocumentRef) private _document: Document
  ) {
    this.dropped = this._dropped.asObservable();
    this.start = this._start.asObservable();
    
    this._element.classList.add('ug-layout__drop-indicator');
    this._element.hidden = true;
    this._document.body.appendChild(this._element);
  }

  initialize(item: Renderable, draggable: Draggable<Renderable>): void {
    this._item = item;
    this._start.next(item);

    draggable.drag
      .filter(Draggable.isDraggingEvent)
      .takeUntil(draggable.drag.filter(Draggable.isDragStopEvent))
      .subscribe(this._onDrag.bind(this));
    
    draggable.drag
      .filter(Draggable.isDragStopEvent)
      .first()
      .subscribe(this._onDragStop.bind(this));

    this._element.hidden = false;
  } 
  
  setDropAreas(areas: DropArea[]): void {
    this._areas = areas;
  }

  setBounds(x: number, x2: number, y: number, y2: number): void {
    this._bounds = { x, y, x2, y2 };
  }

  private _onDrag(e: DragEvent<Renderable>): void {
    if (!this._areas) {
      return;
    }

    const { pageX, pageY } = e;
    let minSurface = Infinity;
    let result: DropArea|null = null;
    
    for (const entry of this._areas) {
      if (
        pageX > entry.area.x &&
        pageX < entry.area.x2 &&
        pageY > entry.area.y &&
        pageY < entry.area.y2 &&
        minSurface > entry.area.surface
      ) {
        minSurface = entry.area.surface;
        result = entry;  
      }
    }

    if (result) {
      this._dropArea = result;
      this._element.style.left = `${result.area.x}px`;
      this._element.style.top = `${result.area.y}px`;
      this._element.style.width = `${result.area.width}px`;
      this._element.style.height = `${result.area.height}px`;
    }
  }

  private _onDragStop(): void {
    this._areas = null;
    console.log(this._dropArea, this._item);
    this._element.hidden = true;
  }
}