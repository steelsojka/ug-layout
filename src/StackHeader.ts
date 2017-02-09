import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from './di';
import { Renderable } from './dom';
import { Stack } from './Stack';
import { StackTab, StackTabConfigArgs } from './StackTab';
import { ConfigurationRef, ContainerRef } from './common';
import { Subject, Observable, CancelAction, AsyncEvent } from './events';

export interface StackHeaderConfig {
  size: number;
  maxTabSize: number;
  distribute: boolean;
}

export type StackHeaderConfigArgs = {
  [P in keyof StackHeaderConfig]?: StackHeaderConfig[P];
}

export class StackHeader extends Renderable {
  tabSelected: Observable<StackTab>;
  tabClosed: Observable<AsyncEvent<StackTab>>;
  
  private _tabs: StackTab[] = [];
  private _tabSelected: Subject<StackTab> = new Subject();
  private _tabClosed: Subject<AsyncEvent<StackTab>> = new Subject();
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) private _config: StackHeaderConfig,
    @Inject(ContainerRef) protected _container: Stack
  ) {
    super(_container);
    
    this.tabSelected = this._tabSelected.asObservable();
    this.tabClosed = this._tabClosed.asObservable();
  } 

  get width(): number {
    return this._container.isHorizontal ? this._container.width : this._config.size;
  }

  get height(): number {
    return this._container.isHorizontal ? this._config.size : this._container.height;
  }

  get isHorizontal(): boolean {
    return this._container.isHorizontal;
  }

  get isDistributed(): boolean {
    return Boolean(this._config.distribute);
  }

  addTab(config: StackTabConfigArgs): StackTab {
    const tab = Injector.fromInjectable(
      StackTab, 
      [
        { provide: ContainerRef, useValue: this },
        { provide: ConfigurationRef, useValue: config },
        StackTab 
      ],
      this._injector
    )
      .get(StackTab) as StackTab;

    tab.onSelection
      .takeUntil(tab.destroyed)
      .subscribe(this._onTabSelection.bind(this));
      
    tab.beforeDestroy
      .takeUntil(tab.destroyed)
      .subscribe(e => this._tabClosed.next(e));
      
    tab.destroyed.subscribe(tab => this.removeTab(tab));

    this._tabs.push(tab);

    return tab;
  }

  removeTab(tab: StackTab): void {
    const index = this._tabs.indexOf(tab);
    
    if (index === -1) {
      return;   
    }
    
    this._tabs.splice(index, 1);
    this._container.removeTab(tab);
  }

  isTabActive(tab: StackTab): boolean {
    return this._container.isActiveTab(tab);
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

  destroy(): void {
    for (const tab of this._tabs) {
      tab.destroy();
    }

    super.destroy();
  }

  getChildren(): StackTab[] {
    return [ ...this._tabs ];
  }

  private _onTabSelection(tab: StackTab): void {
    this._tabSelected.next(tab);
    this._container.setActiveTab(tab);
  }
}