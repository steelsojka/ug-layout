import { XYContainer, XYContainerConfig } from './XYContainer';
import { ConfiguredRenderable } from '../dom';
import { XYDirection } from '../common';

export interface RowConfig extends XYContainerConfig {}

export class Row extends XYContainer {
  protected _direction: XYDirection.X = XYDirection.X;
  protected _className: string = 'ug-layout__row';

  static configure(config: RowConfig): ConfiguredRenderable<Row> {
    return new ConfiguredRenderable(Row, config);
  }
}