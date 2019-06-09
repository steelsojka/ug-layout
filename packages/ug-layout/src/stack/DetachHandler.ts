import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';
import DOMAttrs from 'snabbdom/modules/attributes';
import { Subject, Observable, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { VNode, Renderer } from '../dom';
import { Injector, Inject } from '../di';
import { WindowRef, PatchRef, DocumentRef, RootConfigRef } from '../common';
import { RootLayoutCreationConfigArgs } from '../RootLayout';
import { debounce } from '../utils/throttle';
import { DetachHost } from './DetachHost';

export interface DetachLoc {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class DetachHandler {
  private _child: Window | null = null;
  private _renderer: Renderer | null = null;
  private _vnode: VNode | null = null;
  private _onClose: Subject<void> = new Subject();
  private _onResize: Subject<void> = new Subject();
  private _onDestroy: Subject<void> = new Subject();
  private _onDetach: Subject<void> = new Subject();
  private _lastLoc: Partial<DetachLoc> = {};

  readonly onClose: Observable<void> = this._onClose.asObservable();
  readonly onResize: Observable<void> = this._onResize.asObservable();
  readonly onDestroy: Observable<void> = this._onDestroy.asObservable();
  readonly onDetach: Observable<void> = this._onDetach.asObservable();

  constructor(
    @Inject(WindowRef) private _windowRef: Window,
    @Inject(Injector) private _injector: Injector,
    @Inject(RootConfigRef) private _rootConfig: RootLayoutCreationConfigArgs,
    @Inject(DetachHost) private _detachHost: DetachHost
  ) {
    fromEvent(this._windowRef, 'beforeunload')
      .pipe(takeUntil(this.onDestroy))
      .subscribe(() => this.destroy());

    this._detachHost.registerHandler(this);
  }

  get isDetached(): boolean {
    return Boolean(this._child);
  }

  get height(): number {
    return this._child ? this._child.innerHeight : 0;
  }

  get width(): number {
    return this._child ? this._child.innerWidth : 0;
  }

  render(node: VNode): void {
    if (this.isDetached) {
      this._vnode = node;
      this._renderer!.render();
    }
  }

  getChild(): Window | null {
    return this._child;
  }

  getLoc(): Partial<DetachLoc> {
    this._captureLoc();

    return this._lastLoc;
  }

  detach(loc: Partial<DetachLoc> = {}): Promise<boolean> {
    return new Promise(resolve => {
      if (this.isDetached) {
        resolve(false);

        return;
      }

      const top = loc.y || this._lastLoc.y || 0;
      const left = loc.x || this._lastLoc.x || 0;
      const height = loc.height || this._lastLoc.height || 680;
      const width = loc.width || this._lastLoc.width || 800;
      const url = this._rootConfig.detachUrl || undefined;

      this._child = this._windowRef.open(
        url,
        '_blank',
        `height=${height},width=${width},menubar=no,status=no,top=${top},left=${left},resizable=true`
      );
      this._renderer = this._injector
        .resolveAndCreateChild([
          {
            provide: PatchRef,
            useValue: snabbdom.init([
              DOMClass,
              DOMStyle,
              DOMProps,
              DOMEvents,
              DOMAttrs
            ])
          },
          {
            provide: DocumentRef,
            useValue: this._child!.document
          }
        ])
        .resolveAndInstantiate(Renderer);

      this._renderer!.useNodeGenerator(() => this._vnode!);

      fromEvent(this._child!, 'beforeunload')
        .pipe(takeUntil(this.onDestroy))
        .subscribe(() => {
          this._captureLoc();
          this._cleanUp();
          this._onClose.next();
        });

      fromEvent(this._child!, 'resize')
        .pipe(takeUntil(this.onDestroy))
        .subscribe(debounce(() => this._onResize.next(), 50));

      fromEvent(this._child!, 'DOMContentLoaded')
        .pipe(takeUntil(this.onDestroy))
        .subscribe(() => {
          this._renderer!.setContainer(this._child!.document.body);
          this._onDetach.next();
          resolve(true);
        });
    });
  }

  close(): void {
    if (this._child) {
      this._child.close();
    }
  }

  destroy(): void {
    this._onDestroy.next();

    if (this._child) {
      this._child.close();
    }

    this._onDestroy.complete();
    this._onClose.complete();
    this._onResize.complete();
    this._onDetach.complete();
  }

  focus(): void {
    if (this._child) {
      this._child.focus();
    }
  }

  private _captureLoc(): void {
    if (this._child) {
      this._lastLoc = {
        x: this._child.screenX,
        y: this._child.screenY,
        height: this._child.innerHeight,
        width: this._child.innerWidth
      };
    }
  }

  private _cleanUp(): void {
    this._child = null;
    this._renderer = null;
  }
}
