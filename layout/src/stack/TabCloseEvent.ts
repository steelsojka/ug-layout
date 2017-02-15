import { Cancellable } from '../events';
import { StackTab } from './StackTab';

export class TabCloseEvent extends Cancellable<StackTab> {}