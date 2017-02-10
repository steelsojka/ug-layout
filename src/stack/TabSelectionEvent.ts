import { Cancellable } from '../events';
import { StackTab } from './StackTab';

export class TabSelectionEvent extends Cancellable<StackTab> {}