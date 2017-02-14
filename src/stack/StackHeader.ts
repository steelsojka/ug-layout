import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../di';
import { Renderable, RenderableInjector, ConfiguredRenderable } from '../dom';
import { Stack } from './Stack';
import { Draggable } from '../Draggable';
import { StackTab, StackTabConfigArgs } from './StackTab';
import { TabCloseEvent } from './TabCloseEvent';
import { TabSelectionEvent } from './TabSelectionEvent';
import { ConfigurationRef, ContainerRef } from '../common';
import { Subject, Observable, BeforeDestroyEvent } from '../events';
import { StackControl, StackControlConfig } from './StackControl';
import { StackItemContainer } from './StackItemContainer';

export interface StackHeaderConfig {
  size: number;
  distribute: boolean;
  controls: StackControlConfig[];
}

export type StackHeaderConfigArgs = {
  [P in keyof StackHeaderConfig]?: StackHeaderConfig[P];
}

export const DEFAULT_STACK_HEADER_SIZE = 25;

export class StackHeader extends Renderable {
  tabSelected: Observable<StackTab>;
  tabClosed: Observable<BeforeDestroyEvent<StackTab>>;
  
  private _tabs: StackTab[] = [];
  private _controls: StackControl[] = [];
  private _tabSelected: Subject<StackTab> = new Subject();
  private _tabClosed: Subject<BeforeDestroyEvent<StackTab>> = new Subject();
  private _config: StackHeaderConfig;
  
  constructor(
    @Inject(Injector) private _injector: Injector,
    @Inject(ConfigurationRef) _config: StackHeaderConfigArgs|null,
    @Inject(ContainerRef) protected _container: Stack
  ) {
    super(_container);
    
    this.tabSelected = this._tabSelected.asObservable();
    this.tabClosed = this._tabClosed.asObservable();

    this._config = Object.assign({
      controls: [],
      size: DEFAULT_STACK_HEADER_SIZE,
      distribute: false
    }, _config);

    this._config.controls.forEach(control => this.addControl(control));
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
        Draggable,
        StackTab 
      ],
      this._injector
    )
      .get(StackTab) as StackTab;

    tab.subscribe(TabSelectionEvent, this._onTabSelection.bind(this));

    tab.subscribe(BeforeDestroyEvent, e => {
      this._eventBus.next(e.delegate(TabCloseEvent));
    });
      
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

  addControl(config: StackControlConfig): void {
    const control = RenderableInjector.fromRenderable(
      config.use, 
      [
        { provide: ContainerRef, useValue: this }
      ]
    )
      .get(ConfiguredRenderable);

    this._controls.push(control);
  }

  isTabActive(tab: StackTab): boolean {
    return this._container.isActiveTab(tab);
  }

  getItemFromTab(tab: StackTab): StackItemContainer|null {
    return this._container.getContainerAtIndex(this._tabs.indexOf(tab));
  }

  render(): VNode {
    return h('div.ug-layout__stack-header', {
      style: {
        height: `${this.height}px`,
        width: `${this.width}px`
      }
    }, 
      [
        h('div.ug-layout__tab-container', this._tabs.map(tab => tab.render())),
        h('div.ug-layout__stack-controls', this._controls.map(control => control.render()))
      ]
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

  private _onTabSelection(event: TabSelectionEvent): void {
    this._eventBus.next(event);
  }
}