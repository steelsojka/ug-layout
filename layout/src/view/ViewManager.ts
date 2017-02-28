import { Inject, Type } from '../di';
import { ViewFactory, ViewFactoryArgs } from './ViewFactory';
import { ViewContainer } from './ViewContainer';
import { VIEW_CONFIG_KEY, ViewConfig, ViewComponentConfig, ResolverStrategy } from './common';

export class ViewManager {
  private _views: Map<any, { [key: string]: ViewContainer<any> }> = new Map();
  private _refs: Map<string, ViewContainer<any>> = new Map();
  
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

  destroy() {
    for (const views of this._views.values()) {
      for (const key of Object.keys(views)) {
        const view = views[key] as ViewContainer<any>|null;

        if (view) {
          view.destroy();  
        }
      }
    }      
  }

  getRef<T>(ref: string): ViewContainer<T>|null {
    return this._refs.get(ref) || null;
  }

  resolve<T>(config: ViewConfig): ViewContainer<T>|null {
    const token = this._viewFactory.getTokenFrom(config);
    const metadata = this._assertAndReadComponent(token);

    return this._resolve<T>(config, metadata);
  }
  
  resolveOrCreate<T>(args: ViewFactoryArgs): ViewContainer<T> {
    return this.resolveOrCreateWith<T>(args.config, (): ViewContainer<T> => {
      return this._viewFactory.create<T>(args);
    });
  }
  
  resolveOrCreateWith<T>(config: ViewConfig, factory: (viewFactory: ViewFactory) => ViewContainer<T>): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(config);
    const metadata = this._assertAndReadComponent(token);

    const container = this._resolve<T>(config, metadata);

    if (container) {
      return container;
    }

    return this.createWith<T>(config, factory);
  }

  create<T>(args: ViewFactoryArgs): ViewContainer<T> {
    return this.createWith(args.config, (): ViewContainer<T> => {
      return this._viewFactory.create<T>(args);
    })
  }
  
  createWith<T>(config: ViewConfig, factory: (viewFactory: ViewFactory) => ViewContainer<T>): ViewContainer<T> {
    const token = this._viewFactory.getTokenFrom(config);
    
    this._assertAndReadComponent(token);
    
    const container = factory(this._viewFactory);

    this.register(token, container, { ref: config.ref });
    
    return container;
  }

  register(token: any, container: ViewContainer<any>, options: { ref?: string|null } = {}): void {
    const { ref } = options;
    
    if (!this._views.has(token)) {
      this._views.set(token, {});
    }

    const map = this._views.get(token) as { [key:number]: ViewContainer<any> };

    if (map.hasOwnProperty(container.id)) {
      throw new Error(`An view instance entry already exists for ${token} ${container.id}`);
    }

    map[container.id] = container;

    this._views.set(token, map);

    container.destroyed.subscribe(() => this.unregister(token, container, { ref }));

    if (ref) {
      if (this._refs.has(ref)) {
        throw new Error(`Ref '${ref}' already exists.`);
      }
      
      this._refs.set(ref, container);
    }
  }
  
  unregister(token: any, container: ViewContainer<any>, options: { ref?: string|null } = {}): void {
    const { ref } = options;
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

    if (ref && this._refs.has(ref)) {
      this._refs.delete(ref);
    }
  }

  private _resolve<T>(config: ViewConfig, metadata: ViewComponentConfig): ViewContainer<T>|null {
    const resolution = this._viewFactory.resolveConfigProperty(config, 'resolution');
      
    // REF
    if (resolution === ResolverStrategy.REF) {
      if (config.ref && this._refs.has(config.ref)) {
        return this.getRef(config.ref) as ViewContainer<T>;
      }
    } else {
      // SINGLETON
      const token = this._viewFactory.getTokenFrom(config);
      const views = this.getAll(token);

      if (views) {
        const keys = Object.keys(views);

        if (keys.length) {
          return views[keys[0]];
        }
      }
    }
    
    return null;
  }

  private _assertAndReadComponent(token: any): ViewComponentConfig {
    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, token) as ViewComponentConfig|undefined;

    if (!metadata) {
      throw new Error(`The given token is not a registered ViewComponent.`);
    }

    return metadata;
  }
}