import { Injector } from './di';
import { DOMRenderer } from './dom';

export class RootInjector extends Injector {
  constructor() {
    super([
      DOMRenderer
    ]);
  }
}