import { Renderable } from '../../dom';

export abstract class TabControl extends Renderable {
  isActive(): boolean {
    return true;
  }
}