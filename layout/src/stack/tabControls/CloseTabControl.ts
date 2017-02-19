import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { Inject, Injector } from '../../di';
import { TabControl } from './TabControl';
import { ContainerRef } from '../../common';
import { StackItemContainer } from '../StackItemContainer';
import { StackTab } from '../StackTab';
import { TabCloseEvent } from '../TabCloseEvent';

/**
 * A control that triggers a tab to close.
 * @export
 * @class CloseTabControl
 * @extends {TabControl}
 */
export class CloseTabControl extends TabControl {
  constructor(
    @Inject(ContainerRef) protected _container: StackItemContainer,
    @Inject(Injector) _injector: Injector
  ) {
    super(_injector);
  }
  
  render(): VNode {
    return h('div.ug-layout__stack-tab-close', {
      on: {
        click: e => this._onClick(e)
      }
    }, 'x');
  }

  isActive(): boolean {
    return this._container.closable;
  }

  private _onClick(e: MouseEvent): void {
    const tab = this._container.tab as StackTab;
    
    e.stopPropagation();
    tab.emitUp(new TabCloseEvent(tab));
  }
}