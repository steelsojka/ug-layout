import { VNode } from 'snabbdom/vnode';
import h from 'snabbdom/h';

import { StackControl } from './StackControl';
import { MinimizeCommand } from '../../commands';
import { XYItemContainer } from '../../XYContainer';

export class MinimizeStackControl extends StackControl {
  get width(): number {
    return this.container.width;
  }

  get height(): number {
    return this.container.height;
  }

  render(): VNode {
    const styles: { [key: string] : string } = {};
    const container = this.getParent(XYItemContainer);

    if (this.container.isHorizontal) {
      styles.height = `${this.height}px`;
    } else {
      styles.width = `${this.width}px`;
    }

    return h('div.ug-layout__stack-minimize-control.ug-layout__align-center', {
      style: styles
    }, [
      h('div', {
        class: {
          'ug-icon-chevron-down': container ? !container.isMinimized : true,
          'ug-icon-chevron-up': container ? container.isMinimized : false,
        },
        attrs: {
          title: container && container.isMinimized ? 'Unminimize' : 'Minimize'
        },
        on: {
          click: e => this._onClick(e)
        }
      })
    ]);
  }

  private _onClick(e: MouseEvent): void {
    e.stopPropagation();
    e.preventDefault();

    this.emitUp(new MinimizeCommand(this, { size: this.height }))
  }
}