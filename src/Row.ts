import { Inject } from './di';
import { XYContainer } from './XYContainer';
import { Renderable } from './dom';
import { XYDirection, ContainerRef } from './common';

export class Row extends XYContainer {
  protected _direction: XYDirection.X = XYDirection.X;
  protected _className: string = 'ug-layout__row';

  constructor(
    @Inject(ContainerRef) _container: Renderable
  ) {
    super(_container);
  }
}