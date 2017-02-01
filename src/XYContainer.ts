import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Renderable } from './dom';
import { Inject, Injector } from './di';
import { ContainerRef, XYDirectionRef, XYDirection } from './common';

export abstract class XYContainer implements Renderable {
  protected _height: number = 0;
  protected _width: number = 0;
  protected _direction: XYDirection;
  protected _className: string;

  constructor(
    @Inject(ContainerRef) protected _container: Renderable
  ) {}

  get height(): number {
    return this._height;
  }

  get width(): number {
    return this._width;
  }

  get direction(): XYDirection {
    return this._direction;
  }
  
  render(): VNode {
    return h(`div.${this._className}`, {
      style: {
        height: `${this._height}px`,
        width: `${this._width}px`
      }
    }, []);
  }

  resize(): void {
    this._height = this._container.height;
    this._width = this._container.width;

    // resize views here
  }
}