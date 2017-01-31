import { Injector } from './di';
import { DOMRenderer } from './DOMRenderer';

export class RootInjector extends Injector {
  constructor() {
    super([
      DOMRenderer
    ]);
  }
}