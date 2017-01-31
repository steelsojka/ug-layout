import { Injector, Inject, forwardRef } from './di';
import { ParentLayoutRef } from './common';


export class UgLayout {
  constructor(
    @Inject(UgLayout) private _parent: UgLayout,
    @Inject(Injector) private _injector: Injector
  ) {}  

  spawn(): UgLayout {
    const injector = this._injector.spawn([
      { provide: ParentLayoutRef, useValue: this }, 
      { provide: Injector, useValue: forwardRef(() => injector) },
      UgLayout
    ]);

    return injector.get(UgLayout) as UgLayout;
  }
}