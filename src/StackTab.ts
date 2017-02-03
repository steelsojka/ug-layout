import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di'
import { Subject, Observable } from './events';
import { Renderable, ConfiguredRenderable } from './dom';
import { ContainerRef, ConfigurationRef } from './common';
import { StackHeader } from './StackHeader';
import { Stack } from './Stack';

export interface StackTabConfig {
  maxWidth: number;
  title: string;
}

export type StackTabConfigArgs = {
  [P in keyof StackTabConfig]?: StackTabConfig[P];
}

export class StackTab implements Renderable {
  onSelection: Observable<StackTab>;
  
  private _onSelection: Subject<StackTab> = new Subject();
  
  constructor(
    @Inject(ContainerRef) private _container: StackHeader,
    @Inject(ConfigurationRef) private _config: StackTabConfig
  ) {
    this.onSelection = this._onSelection.asObservable();
    this._config = Object.assign({
      maxWidth: 150,
      title: ''   
    }, this._config || {});
  }
  
  get width(): number {
    return this._container.isHorizontal ? Number.MAX_SAFE_INTEGER : this._container.width;
  }

  get height(): number {
    return this._container.isHorizontal ? this._container.height : Number.MAX_SAFE_INTEGER;
  }
  
  render(): VNode {
    return h('div.ug-layout__stack-tab', {
      style: {
        'max-width': `${this._config.maxWidth}px`
      },
      on: {
        click: () => this._onClick()
      }
    }, [
      h('div', this._config.title)
    ])  
  }  

  resize(): void {
    
  }

  destroy(): void {
    this._onSelection.complete();
  }

  private _onClick(): void {
    this._onSelection.next(this);
  }
}