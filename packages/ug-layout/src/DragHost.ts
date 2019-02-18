import { Observable, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

import { Inject, PostConstruct } from './di';
import {
  DocumentRef,
  DropArea,
  RenderableDropTarget,
  DragEvent
} from './common';
import { Renderable, RenderableArea } from './dom';
import { Draggable } from './Draggable';
import { isObject, isFunction } from './utils';

export class DragHostContainer {
  item: Renderable;
  dragArea: RenderableArea;
  draggable: Draggable<Renderable>;
}

export class DragHost {
  @Inject(DocumentRef) private _document: Document;
  private _item: Renderable;
  private _dropped: Subject<DropArea> = new Subject();
  private _start: Subject<DragHostContainer> = new Subject();
  private _fail: Subject<Renderable> = new Subject();
  private _success: Subject<Renderable> = new Subject();
  private _areas: DropArea[]|null = null;
  private _dropArea: DropArea|null = null;
  private _bounds: RenderableArea|null = null;
  private _dragArea: RenderableArea;
  private _element: HTMLElement;

  readonly dropped: Observable<DropArea> = this._dropped.asObservable();
  readonly start: Observable<DragHostContainer> = this._start.asObservable();
  readonly fail: Observable<Renderable> = this._fail.asObservable();
  readonly success: Observable<Renderable> = this._success.asObservable();

  get bounds(): RenderableArea|null {
    return this._bounds;
  }

  set bounds(val: RenderableArea|null) {
    this._bounds = val;
  }

  destroy(): void {
    if (this._document.body.contains(this._element)) {
      this._document.body.removeChild(this._element);
    }
  }

  @PostConstruct()
  init(): void {
    this._element = this._document.createElement('div');
    this._element.classList.add('ug-layout__drop-indicator');
    this._element.hidden = true;
    this._document.body.appendChild(this._element);
  }

  initialize(container: DragHostContainer): void {
    const { item, dragArea, draggable } = container;

    this._item = item;
    this._dragArea = dragArea;
    this._start.next(container);

    draggable.drag
      .pipe(
        filter(Draggable.isDraggingEvent),
        takeUntil(draggable.drag.pipe(filter(Draggable.isDragStopEvent))))
      .subscribe(this._onDrag.bind(this));

    draggable.drag
      .pipe(
        filter(Draggable.isDragStopEvent),
        takeUntil(this._dropped))
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

    const pageX = this._bounds ? this._bounds.clampX(e.pageX) : e.pageX;
    const pageY = this._bounds ? this._bounds.clampY(e.pageY) : e.pageY;

    let minSurface = Infinity;
    let result: DropArea|null = null;

    for (const entry of this._areas) {
      if (
        pageX >= entry.area.x &&
        pageX <= entry.area.x2 &&
        pageY >= entry.area.y &&
        pageY <= entry.area.y2 &&
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
        pageX, pageY,
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
      this._fail.next(e.host);
    } else {
      this._areas = null;
      this._element.hidden = true;
      this._item.handleDropCleanup();
      this._dropArea.item.handleDrop(this._item, this._dropArea, e);
      this._success.next(e.host);
    }

    this._dropped.next();
  }

  static isDropTarget(item: any): item is RenderableDropTarget {
    return isObject(item)
      && item instanceof Renderable
      && isFunction(item['getHighlightCoordinates'])
      && isFunction(item['handleDrop']);
  }
}