import { VNode } from 'snabbdom/vnode';

import { Inject } from '../di';
import { Subject, Observable } from '../events';
import { DocumentRef, PatchRef, Patch } from '../common';

/**
 * Renders the layout.
 * @export
 * @class Renderer
 */
export class Renderer {
  /**
   * Notifies when a render cycle has finished.
   * @type {Observable<void>}
   */
  rendered: Observable<void>;
  
  private _rendered: Subject<void> = new Subject<void>();
  private _lastVNode: VNode|null = null;
  private _containerEl: Node;
  private _nodeGenerator: () => VNode;
  private _mountPoint: HTMLElement;

  /**
   * Creates an instance of Renderer.
   * @param {Document} _document 
   * @param {Patch} _patch 
   */
  constructor(
    @Inject(DocumentRef) private _document: Document,
    @Inject(PatchRef) private _patch: Patch
  ) {
    this.rendered = this._rendered.asObservable();
  }

  /**
   * Initializes the renderer with the containing DOM element to mount to.
   * @param {Node} containerEl 
   */
  initialize(containerEl: Node): void {
    this._mountPoint = this._document.createElement('div');
    this.setContainer(containerEl);
  }

  setContainer(containerEl: Node): void { 
    this._containerEl = containerEl;
    this._containerEl.appendChild(this._mountPoint);
    this.reset();
  }

  /**
   * Sets a the function that generates the virtual DOM tree.
   * @param {function(): VNode} fn 
   */
  useNodeGenerator(fn: () => VNode): void {
    this._nodeGenerator = fn;
  }

  /**
   * Updates the DOM with the current state of the renderable tree.
   * @returns {void} 
   */
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

  /**
   * Destroys the renderer.
   */
  destroy(): void {
    this.detach();
    this._rendered.complete();
  }

  /**
   * Resets the render state. A full rerender of the DOM will apply on the next render.
   */
  reset(): void {
    this._lastVNode = null;
  }

  /**
   * Detatches the renderer and it's DOM node from the containing element.
   */
  detach(): void {
    if (this._containerEl) {
      const el = this._lastVNode && this._lastVNode.elm ? this._lastVNode.elm : this._mountPoint;

      if (this._containerEl.contains(el)) {
        this._containerEl.removeChild(el);
      }
    }
  }
}