import { Inject, Type } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';
import { VIEW_CONFIG_KEY, ViewConfig, ViewComponentConfig, ResolverStrategy } from './common';

export class ViewManager {
  private _views: Map<any, { [key:number]: ViewContainer<any> }> = new Map();
  
  constructor(
    @Inject(ViewFactory) private _viewFactory: ViewFactory
  ) {}

  has(token: any, id?: number): boolean {
    const map = this.getAll(token);
    
    if (!map) {
      return false;
    }

    if (id != null) {
      return map.hasOwnProperty(id);
    }

    return true;
  }

  get<T>(token: any, id: number): ViewContainer<T>|null {
    const map = this.getAll(token);

    if (!map) {
      return null;
    }

    return map.hasOwnProperty(id) ? map[id] : null;
  }

  getAll(token: any): ({ [key:number]: ViewContainer<any> })|null {
    return this._views.get(token) || null;
  }

  resolve<T>(args: ViewFactoryArgs): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(args.config);
    
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    this._assertComponent(token);

    return this._resolve<T>(args, metadata as ViewComponentConfig);
  }

  create<T>(config: ViewFactoryArgs): ViewContainer<T> {
    const container = this._viewFactory.create<T>(config);
    const token = this._viewFactory.getTokenFrom(config.config);

    this._assertComponent(token);
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

  private _resolve<T>(factoryArgs: ViewFactoryArgs, metadata: ViewComponentConfig): ViewContainer<T> {
    if (metadata.resolution === ResolverStrategy.TRANSIENT) {
      return this.create<T>(factoryArgs);
    }

    const token = this._viewFactory.getTokenFrom(factoryArgs.config);
    const views = this.getAll(token);

    if (views) {
      const keys = Object.keys(views);

      if (keys.length) {
        return views[keys[0]];
      }
    }

    return this.create<T>(factoryArgs);
  }

  private _assertComponent(token: any): void {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    if (!metadata) {
      throw new Error(`The given token is not a registered ViewComponent.`);
    }
  }
}