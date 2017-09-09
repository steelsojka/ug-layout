import { Renderable } from '../../dom';
import { StackItemContainer } from '../StackItemContainer';

export abstract class TabControl extends Renderable {
  container: StackItemContainer;
  
  isActive(): boolean {
    return true;
  }
}