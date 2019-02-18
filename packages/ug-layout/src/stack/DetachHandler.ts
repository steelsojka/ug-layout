import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';
import DOMAttrs from 'snabbdom/modules/attributes';
import { Subject, Observable } from 'rxjs';

import { VNode, Renderer } from '../dom';
import { Injector, Inject } from '../di';
import { WindowRef, PatchRef, DocumentRef, RootConfigRef } from '../common';
import { RootLayoutCreationConfigArgs } from '../RootLayout';
import { debounce } from '../utils/throttle';

export class DetachHandler {
  private _child: Window | null = null;
  private _renderer: Renderer | null = null;
  private _vnode: VNode | null = null;
  private _onClose: Subject<void> = new Subject();
  private _onResize: Subject<void> = new Subject();
  private _boundClose = this.close.bind(this);
  private _lastLoc: {
    x?: number;
    y?: number;
    height?: number;
    width?: number;
  } = {};

  readonly onClose: Observable<void> = this._onClose.asObservable();
  readonly onResize: Observable<void> = this._onResize.asObservable();

  constructor(
    @Inject(WindowRef) private _windowRef: Window,
    @Inject(Injector) private _injector: Injector,
    @Inject(RootConfigRef) private _rootConfig: RootLayoutCreationConfigArgs
  ) {
    this._windowRef.addEventListener('beforeunload', this._boundClose);
  }

  get isDetached(): boolean {
    return Boolean(this._child);
  }

  get height(): number {
    return this._child ? this._child.innerHeight : 0;
  }

  get width(): number {
    return this._child ? this._child.innerWidth: 0;
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

  detach(): Promise<boolean> {
    return new Promise(resolve => {
      if (this.isDetached) {
        resolve(false);

        return;
      }

      const top = this._lastLoc.y || 0;
      const left = this._lastLoc.x || 0;
      const height = this._lastLoc.height || 680;
      const width = this._lastLoc.width || 800;
      const url = this._rootConfig.detachUrl || undefined;

      this._child = this._windowRef.open(url, '_blank', `height=${height},width=${width},menubar=no,status=no,top=${top},left=${left},resizable=true`);
      this._renderer = this._injector.resolveAndCreateChild([ {
        provide: PatchRef,
        useValue: snabbdom.init([
          DOMClass,
          DOMStyle,
          DOMProps,
          DOMEvents,
          DOMAttrs
        ])
      }, {
        provide: DocumentRef,
        useValue: this._child!.document
      } ])
        .resolveAndInstantiate(Renderer);

      this._renderer!.useNodeGenerator(() => this._vnode!);

      this._child!.addEventListener('beforeunload', () => {
        this._lastLoc = {
          x: this._child!.screenX,
          y: this._child!.screenY,
          height: this._child!.innerHeight,
          width: this._child!.innerWidth
        };
        this._child = null;
        this._renderer = null;
        this._onClose.next();
      });

      this._child!.addEventListener('resize', debounce(() => this._onResize.next(), 50));

      this._child!.addEventListener('DOMContentLoaded', () => {
        this._renderer!.setContainer(this._child!.document.body);
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
    this.close();
    this._onClose.complete();
    this._onResize.complete();
    this._windowRef.removeEventListener('beforeunload', this._boundClose);
  }

  focus(): void {
    if (this._child) {
      this._child.focus();
    }
  }
}