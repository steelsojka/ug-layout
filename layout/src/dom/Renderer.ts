import { VNode } from 'snabbdom/vnode';
import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';
import DOMAttrs from 'snabbdom/modules/attributes';

import { Inject } from '../di';
import { Subject, Observable } from '../events';
import { Deferred } from '../utils';
import { DocumentRef } from '../common';

export class Renderer {
  rendered: Observable<void>;
  
  private _rendered: Subject<void> = new Subject<void>();
  private _lastVNode: VNode|null = null;
  private _containerEl: Node;
  private _nodeGenerator: () => VNode;
  private _mountPoint: HTMLElement;
  private _patch: (oldVNode: VNode|Node, newVNode: VNode) => VNode = snabbdom.init([
    DOMClass,
    DOMStyle,
    DOMProps,
    DOMEvents,
    DOMAttrs
  ]);

  constructor(
    @Inject(DocumentRef) private _document: Document
  ) {
    this.rendered = this._rendered.asObservable();
  }

  initialize(containerEl: Node): void {
    this._mountPoint = this._document.createElement('div');
    this._containerEl = containerEl;
    this._containerEl.appendChild(this._mountPoint);
  }

  useNodeGenerator(fn: () => VNode): void {
    this._nodeGenerator = fn;
  }

  render(): void {
    if (!this._nodeGenerator) {
      return;
    }
    
    if (this._lastVNode) {
      this._lastVNode = this._patch(this._lastVNode, this._nodeGenerator());
    } else {
      this._lastVNode = this._patch(this._mountPoint, this._nodeGenerator());
    }

    this._rendered.next();
  }

  destroy(): void {
    this.detach();
    this._rendered.complete();
  }

  detach(): void {
    if (this._lastVNode) {
      if (this._lastVNode.elm) {
        this._containerEl.removeChild(this._lastVNode.elm);
      }
    } else {
      this._containerEl.removeChild(this._mountPoint);
    }
  }
}