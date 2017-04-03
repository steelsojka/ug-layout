import { Inject, Injector } from '../di';
import { XYContainer, XYContainerConfig } from './XYContainer';
import { Renderable, ConfiguredRenderable, Renderer } from '../dom';
import { 
  XYDirection, 
  ContainerRef, 
  ConfigurationRef
} from '../common';

export interface RowConfig extends XYContainerConfig {}

export class Row extends XYContainer {
  protected _direction: XYDirection.X = XYDirection.X;
  protected _className: string = 'ug-layout__row';

  constructor(
    @Inject(ConfigurationRef) config: RowConfig|null
  ) {
    super(config);
  }

  static configure(config: RowConfig): ConfiguredRenderable<Row> {
    return new ConfiguredRenderable(Row, config);     
  }
}