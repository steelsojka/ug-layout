import { VNode } from 'snabbdom/vnode';

export abstract class Renderable {
  protected _width: number;  
  protected _height: number;
  protected _isDestroyed: boolean = false;

  get width(): number {
    return this._width;
  }

  get height(): number {
    return this._width;
  }

  get isDestroyed(): boolean {
    return this._isDestroyed;
  }

  abstract render(): VNode
  abstract resize(): void

  destroy(): void {
    this._isDestroyed = true;
  }
}