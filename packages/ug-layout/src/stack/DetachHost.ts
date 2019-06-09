import { Subject } from 'rxjs';

import { DetachHandler } from './DetachHandler';

/**
 * A host that notifies events of detach handlers.
 */
export class DetachHost {
  private readonly _onDetach: Subject<DetachHandler> = new Subject();
  readonly onDetach = this._onDetach.asObservable();

  private readonly _onRegister: Subject<DetachHandler> = new Subject();
  readonly onRegister = this._onDetach.asObservable();

  registerHandler(handler: DetachHandler): void {
    this._onRegister.next(handler);

    handler.onDetach.subscribe(() => this._onDetach.next(handler));
  }
}
