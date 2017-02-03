import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di';
import { Renderable } from './dom';
import { Stack } from './Stack';
import { StackTab, StackTabConfigArgs } from './StackTab';
import { ConfigurationRef, ContainerRef } from './common';

export interface StackHeaderConfig {
  size: number;
  maxTabWidth?: number;
}

export type StackHeaderConfigArgs = {
  [P in keyof StackHeaderConfig]?: StackHeaderConfig[P];
}

export class StackHeader implements Renderable {
  private _tabs: StackTab[] = [];
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackHeaderConfig,
    @Inject(ContainerRef) private _container: Stack
  ) {} 

  get width(): number {
    return this._container.isHorizontal ? this._container.width : this._config.size;
  }

  get height(): number {
    return this._container.isHorizontal ? this._config.size : this._container.height;
  }

  get isHorizontal(): boolean {
    return this._container.isHorizontal;
  }

  addTab(config: StackTabConfigArgs): StackTab {
    const tab = this._injector.spawn([
      { provide: ContainerRef, useValue: this },
      { provide: ConfigurationRef, useValue: config },
      StackTab 
    ])
      .get(StackTab) as StackTab;

    tab.onSelection.subscribe(this._onTabSelection.bind(this));

    this._tabs.push(tab);

    return tab;
  }

  render(): VNode {
    return h('div.ug-layout__stack-header', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, 
      this._tabs.map(tab => tab.render())
    );
  }

  resize(): void {
    for (const tab of this._tabs) {
      tab.resize();
    }
  }

  private _onTabSelection(tab: StackTab): void {
    this._container.setActive(this._tabs.indexOf(tab));
  }
}