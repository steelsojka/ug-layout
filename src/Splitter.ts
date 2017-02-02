import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject } from './di';
import { Renderable } from './dom';
import { ContainerRef, XYDirection, ConfigurationRef } from './common';
import { XYContainer } from './XYContainer';

export const SPLITTER_SIZE = 5;

export interface SplitterConfig {
  size: number;
}

export class Splitter implements Renderable {
  constructor(
    @Inject(ContainerRef) private _container: XYContainer,
    @Inject(ConfigurationRef) private _config: SplitterConfig
  ) {}
  
  get height(): number {
    return this._isRow ? this._container.height : this._config.size;
  }

  get width(): number {
    return this._isRow ? this._config.size : this._container.width;
  }

  get size(): number {
    return this._isRow ? this.width : this.height;
  }

  private get handleStyles(): { [key:string]: any } {
    if (this._isRow) {
      return {
        height: `${this.height}px`,
        width: `${this.width + 20}px`,
        left: '-10px',
        top: 0
      };
    }
    
    return {
      height: `${this.height + 20}px`,
      width: `${this.width}px`,
      left: 0,
      top: '-10px'
    };
  }

  private get _isRow(): boolean {
    return this._container.isRow;
  }

  resize(): void {}

  render(): VNode {
    const _class = this._isRow ? 'ug-layout__splitter-x' : 'ug-layout__splitter-y';
    
    return h(`div.ug-layout__splitter.${_class}`, {
      style: {
        height: this.height,
        width: this.width
      }
    }, [
      h('div.ug-layout__drag-handle', {
        style: this.handleStyles 
      })
    ]);
  }
}