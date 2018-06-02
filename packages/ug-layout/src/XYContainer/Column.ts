import { XYContainer, XYContainerConfig } from './XYContainer';
import { ConfiguredRenderable } from '../dom';
import { XYDirection } from '../common';

export interface ColumnConfig extends XYContainerConfig {}

export class Column extends XYContainer {
  protected _direction: XYDirection.Y = XYDirection.Y;
  protected _className: string = 'ug-layout__column';

  static configure(config: ColumnConfig): ConfiguredRenderable<Column> {
    return new ConfiguredRenderable(Column, config);
  }
}