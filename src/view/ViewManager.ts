import { Inject, Type } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';

export class ViewManager {
  private _views: Map<any, { [key:number]: ViewContainer<any> }> = new Map();
  
  constructor(
    @Inject(ViewFactory) private _viewFactory: ViewFactory
  ) {}

  create<T>(config: ViewFactoryArgs): ViewContainer<T> {
    const container = this._viewFactory.create<T>(config);
    const token = this._viewFactory.getTokenFrom(config.config);

    this.register(token, container);
    
    container.destroyed.subscribe(() => this.unregister(token, container));

    return container;
  }

  register(token: any, container: ViewContainer<any>): void {
    if (!this._views.has(token)) {
      this._views.set(token, {});
    }

    const map = this._views.get(token) as { [key:number]: ViewContainer<any> };

    if (map.hasOwnProperty(container.id)) {
      throw new Error(`An view instance entry already exists for ${token} ${container.id}`);
    }

    map[container.id] = container;

    this._views.set(token, map);
  }
  
  unregister(token: any, container: ViewContainer<any>): void {
    const map = this._views.get(token) as { [key:number]: ViewContainer<any> };

    if (!map) {
      throw new Error(`No entries exist for token ${token}`);
    }

    if (!map.hasOwnProperty(container.id)) {
      throw new Error(`An view instance entry already exists for ${token} ${container.id}`);
    }

    delete map[container.id];

    if (Object.keys(map).length === 0) {
      this._views.delete(token);
    }
  }
}