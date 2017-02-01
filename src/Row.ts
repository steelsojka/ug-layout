import { Inject, Injector } from './di';
import { XYContainer, XYContainerConfig } from './XYContainer';
import { Renderable, ConfiguredRenderable } from './dom';
import { 
  XYDirection, 
  ContainerRef, 
  ConfigurationRef, 
  RenderableConfig 
} from './common';

export interface RowConfig extends XYContainerConfig {}

export class Row extends XYContainer {
  protected _direction: XYDirection.X = XYDirection.X;
  protected _className: string = 'ug-layout__row';

  constructor(
    @Inject(ContainerRef) container: Renderable,
    @Inject(ConfigurationRef) config: RowConfig|null,
    @Inject(Injector) injector: Injector
  ) {
    super(container, config, injector);
  }

  static configure(config: RowConfig): ConfiguredRenderable<Row> {
    return new ConfiguredRenderable(Row, config);     
  }
}