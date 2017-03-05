import { Cancellable } from '../events';
import { StackTab } from './StackTab';

/**
 * Event fired when a tab is selected.
 * @export
 * @class TabSelectionEvent
 * @extends {Cancellable<StackTab>}
 */
export class TabSelectionEvent extends Cancellable<StackTab> {}