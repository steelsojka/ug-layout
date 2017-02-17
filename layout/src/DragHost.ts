import { Inject } from './di';
import { 
  DocumentRef, 
  DropTarget, 
  DropArea, 
  RenderableDropTarget,
  DragStatus,
  DragEvent
} from './common';
import { Renderable, RenderableArea } from './dom';
import { Observable, Subject } from './events';
import { Draggable } from './Draggable';
import { isObject, isFunction, clamp } from './utils';

export class DragHost {
  dropped: Observable<DropArea>;
  start: Observable<Renderable>;
  fail: Observable<Renderable>;
  
  private _item: Renderable;
  private _dropped: Subject<DropArea> = new Subject();
  private _start: Subject<Renderable> = new Subject();
  private _fail: Subject<Renderable> = new Subject();
  private _areas: DropArea[]|null = null;
  private _dropArea: DropArea|null = null;
  private _element: HTMLElement = this._document.createElement('div');
  private _bounds: RenderableArea|null = null;
  private _dragArea: RenderableArea;

  get bounds(): RenderableArea|null {
    return this._bounds;
  }

  set bounds(val: RenderableArea|null) {
    this._bounds = val;
  }

  constructor(
    @Inject(DocumentRef) private _document: Document
  ) {
    this.dropped = this._dropped.asObservable();
    this.start = this._start.asObservable();
    this.fail = this._fail.asObservable();
    
    this._element.classList.add('ug-layout__drop-indicator');
    this._element.hidden = true;
    this._document.body.appendChild(this._element);
  }

  initialize(item: Renderable, draggable: Draggable<Renderable>, dragArea: RenderableArea): void {
    this._item = item;
    this._dragArea = dragArea;
    this._start.next(item);

    draggable.drag
      .filter(Draggable.isDraggingEvent)
      .takeUntil(draggable.drag.filter(Draggable.isDragStopEvent))
      .subscribe(this._onDrag.bind(this));
    
    draggable.drag
      .filter(Draggable.isDragStopEvent)
      .takeUntil(this._dropped)
      .subscribe(this._onDragStop.bind(this));

    this._element.hidden = false;
  } 
  
  setDropAreas(areas: DropArea[]): void {
    this._areas = areas;
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
      if (this._dropArea) {
        this._dropArea.item.onDropHighlightExit();
      }
      
      this._dropArea = result;

      const area = this._dropArea.item.getHighlightCoordinates({
        pageX: e.pageX, 
        pageY: e.pageY, 
        dropArea: result,
        dragArea: this._dragArea
      });
      
      this._element.style.transform = `translate(${area.x}px, ${area.y}px)`;
      this._element.style.height = `${area.height}px`;
      this._element.style.width = `${area.width}px`;
    }
  }

  private _onDragStop(e: DragEvent<Renderable>): void {
    if (!this._dropArea) {
      return;
    }
    
    this._areas = null;
    this._element.hidden = true;
    this._item.handleDropCleanup();
    this._dropArea.item.handleDrop(this._item, this._dropArea, e);
    this._dropped.next(this._dropArea);
  }

  static isDropTarget(item: any): item is RenderableDropTarget {
    return isObject(item) 
      && item instanceof Renderable
      && isFunction(item['getHighlightCoordinates'])
      && isFunction(item['handleDrop']);
  }
}