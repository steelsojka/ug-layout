import { BusEvent } from '../events';
import { StackTab } from './StackTab';

/**
 * Fired when a tab is dragged.
 * @export
 * @class TabDragEvent
 * @extends {BusEvent<StackTab>}
 */
export class TabDragEvent extends BusEvent<StackTab> {}