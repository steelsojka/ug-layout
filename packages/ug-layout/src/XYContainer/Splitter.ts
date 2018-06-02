import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { Inject, PostConstruct } from '../di';
import { Renderable, RenderableDestroyContext, RenderableConfig } from '../dom';
import { ContainerRef, ConfigurationRef, DragEvent } from '../common';
import { XYContainer } from './XYContainer';
import { Draggable } from '../Draggable';
import { LockState, LOCK_RESIZING } from '../LockState';

export const SPLITTER_SIZE = 5;

export interface SplitterConfig extends RenderableConfig {
  size: number;
  disabler?: (splitter: Splitter) => boolean;
}

export class Splitter extends Renderable<SplitterConfig> {
  dragStatus: Observable<DragEvent<Splitter>>;
  x: number = 0;
  y: number = 0;

  private _isDragging: boolean = false;
  private _element: HTMLElement;
  private _isDisabled: boolean = false;

  @Inject(ConfigurationRef) protected _config: SplitterConfig;
  @Inject(ContainerRef) protected _container: XYContainer;
  @Inject(Draggable) protected _draggable: Draggable<Splitter>;
  @Inject(LockState) protected _lockState: LockState;

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

  get isDisabled(): boolean {
    return this._isDisabled || Boolean(this._config.disabler && this._config.disabler(this));
  }

  private get handleStyles(): { [key:string]: any } {
    if (this._isRow) {
      return {
        height: `${this.height}px`,
        width: `${this.width + 10}px`,
        left: `${this.x - 5}px`,
        top: 0
      };
    }

    return {
      height: `${this.height + 10}px`,
      width: `${this.width}px`,
      left: 0,
      top: `${this.y - 5}px`
    };
  }

  private get _isRow(): boolean {
    return this._container.isRow;
  }

  @PostConstruct()
  initialize(): void {
    super.initialize();

    this.dragStatus = this._draggable.drag;

    this._draggable.drag
      .pipe(filter(Draggable.isDragStopEvent))
      .subscribe(() => this._isDragging = false);

    this._draggable.drag
      .pipe(filter(Draggable.isDragStartEvent))
      .subscribe(this._onDragStart.bind(this));

    this._lockState
      .scope(LOCK_RESIZING)
      .subscribe(isLocked => isLocked ? this.disable() : this.enable());
  }

  dragTo(x = this.x, y = this.y): void {
    this.x = x;
    this.y = y;
    this._element.style.transform = `translateX(${this.x}px) translateY(${this.y}px)`
  }

  render(): VNode {
    return h(`div.ug-layout__splitter`, {
      key: this.uid,
      class: {
        'ug-layout__splitter-disabled': this.isDisabled,
        'ug-layout__splitter-x': this._isRow,
        'ug-layout__splitter-y': !this._isRow,
        'ug-layout__splitter-dragging': this._isDragging
      },
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`,
        transform: `translateX(${this.x}px) translateY(${this.y}px)`
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

  destroy(context: RenderableDestroyContext): void {
    this._draggable.destroy();
    super.destroy(context);
  }

  disable(): void {
    this._isDisabled = true;
  }

  enable(): void {
    this._isDisabled = false;
  }

  private _onMouseDown(e: MouseEvent): void {
    e.preventDefault();

    if (!this.isDisabled) {
      this._draggable.startDrag({
        host: this,
        startX: e.pageX,
        startY: e.pageY,
        threshold: 1
      });
    }
  }

  private _onDragStart(): void {
    this._isDragging = true;
    this._renderer.render();
  }
}