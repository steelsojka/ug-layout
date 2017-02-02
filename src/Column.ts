import { Inject, Injector } from './di';
import { XYContainer, XYContainerConfig } from './XYContainer';
import { Renderable, ConfiguredRenderable } from './dom';
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
  protected _splitterClass: string = 'ug-layout__splitter-y';

  constructor(
    @Inject(ContainerRef) container: Renderable,
    @Inject(ConfigurationRef) config: ColumnConfig|null,
    @Inject(Injector) injector: Injector
  ) {
    super(container, config, injector);
  }
  
  resize(): void {
    super.resize();
    
    for (const child of this._children) {
      child.resize({
        width: this._width, 
        height: (this._height / (100 / child.dimension)) - (this._totalSplitterSize / this._children.length)
      });
    }
  }
  
  static configure(config: ColumnConfig): ConfiguredRenderable<Column> {
    return new ConfiguredRenderable(Column, config);     
  }
}