import { Inject, Injector } from './di';
import { XYContainer, XYContainerConfig } from './XYContainer';
import { Renderable, ConfiguredRenderable, Renderer } from './dom';
import { 
  XYDirection, 
  ContainerRef, 
  ConfigurationRef, 
  RenderableConfig 
} from './common';

export interface ColumnConfig extends XYContainerConfig {}

export class Column extends XYContainer {
  protected _direction: XYDirection.Y = XYDirection.Y;
  protected _className: string = 'ug-layout__column';

  constructor(
    @Inject(ContainerRef) container: Renderable,
    @Inject(ConfigurationRef) config: ColumnConfig|null,
    @Inject(Injector) injector: Injector,
    @Inject(Renderer) renderer: Renderer
  ) {
    super(container, config, injector, renderer);
  }
  
  static configure(config: ColumnConfig): ConfiguredRenderable<Column> {
    return new ConfiguredRenderable(Column, config);     
  }
}