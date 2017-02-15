import { Cancellable } from '../events';
import { StackItemContainer } from './StackItemContainer';

export class StackItemCloseEvent extends Cancellable<StackItemContainer> {}