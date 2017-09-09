import { Cancellable } from '../events';
import { StackTab } from './StackTab';

/**
 * Fired when a tab is closed.
 * @export
 * @class TabCloseEvent
 * @extends {Cancellable<StackTab>}
 */
export class TabCloseEvent extends Cancellable<StackTab> {}