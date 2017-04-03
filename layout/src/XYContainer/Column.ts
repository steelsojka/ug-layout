import { Inject, Injector } from '../di';
import { XYContainer, XYContainerConfig } from './XYContainer';
import { Renderable, ConfiguredRenderable, Renderer } from '../dom';
import { 
  XYDirection, 
  ContainerRef, 
  ConfigurationRef
} from '../common';

export interface ColumnConfig extends XYContainerConfig {}

export class Column extends XYContainer {
  protected _direction: XYDirection.Y = XYDirection.Y;
  protected _className: string = 'ug-layout__column';

  constructor(
    @Inject(ConfigurationRef) config: ColumnConfig|null,
  ) {
    super(config);
  }
  
  static configure(config: ColumnConfig): ConfiguredRenderable<Column> {
    return new ConfiguredRenderable(Column, config);     
  }
}