import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { TabControl } from './TabControl';
import { StackTab } from '../StackTab';
import { TabCloseEvent } from '../TabCloseEvent';

/**
 * A control that triggers a tab to close.
 * @export
 * @class CloseTabControl
 * @extends {TabControl}
 */
export class CloseTabControl extends TabControl {
  render(): VNode {
    return h('div.ug-layout__stack-tab-close.ug-icon-close', {
      attrs: {
        title: 'Close tab'
      },
      on: {
        click: e => this._onClick(e)
      }
    });
  }

  isActive(): boolean {
    return this.container.closeable;
  }

  private _onClick(e: MouseEvent): void {
    const tab = this.container.tab as StackTab;

    e.stopPropagation();
    tab.emitUp(new TabCloseEvent(tab));
  }
}