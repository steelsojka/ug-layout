import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject } from './di';
import { Renderable } from './dom';
import { ContainerRef, XYDirection } from './common';
import { XYContainer } from './XYContainer';

export const SPLITTER_SIZE = 5;

export class Splitter implements Renderable {
  constructor(
    @Inject(ContainerRef) private _container: XYContainer
  ) {}
  
  get height(): number {
    return this._isRow ? this._container.height : SPLITTER_SIZE;
  }

  get width(): number {
    return this._isRow ? SPLITTER_SIZE : this._container.width;
  }

  get size(): number {
    return this._isRow ? this.width : this.height;
  }
  
  private get _isRow(): boolean {
    return this._container.direction === XYDirection.X;
  }

  resize(): void {}

  render(): VNode {
    const _class = this._isRow ? 'ug-layout__splitter-x' : 'ug-layout__splitter-y';
    
    return h(`div.ug-layout__splitter.${_class}`, [
      h('div.ug-layout__drag-handle')
    ]);
  }
}