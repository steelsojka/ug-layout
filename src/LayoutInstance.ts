import { Injector, Inject, forwardRef, Optional } from './di';
import { ParentLayoutRef } from './common';


export class LayoutInstance {
  constructor(
    @Inject(ParentLayoutRef) @Optional() private _parent: LayoutInstance,
    @Inject(Injector) private _injector: Injector
  ) {}  

  spawn(): LayoutInstance {
    const injector = this._injector.spawn([
      { provide: ParentLayoutRef, useValue: this }, 
      { provide: Injector, useValue: forwardRef(() => injector) },
      LayoutInstance
    ]);

    return injector.get(LayoutInstance) as LayoutInstance;
  }
}