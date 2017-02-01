import { Inject } from './di';
import { XYContainer } from './XYContainer';
import { Renderable } from './dom';
import { XYDirection, ContainerRef } from './common';

export class Column extends XYContainer {
  protected _direction: XYDirection.Y = XYDirection.Y;
  protected _className: string = 'ug-layout__column';

  constructor(
    @Inject(ContainerRef) _container: Renderable
  ) {
    super(_container);
  }
}