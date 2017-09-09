export class ConfiguredItem<T, U> {
  constructor(
    private _item: T, 
    private _config: U
  ) {}

  get item(): T {
    return this._item;
  }

  get config(): U {
    return this._config;
  }

  static resolveItem<T>(config: any, notFoundValue?: any): T {
    if (config instanceof ConfiguredItem) {
      return config.item;
    }

    return notFoundValue !== undefined ? notFoundValue : config;
  }

  static resolveConfig<U>(config: any, notFoundValue?: any): U {
    if (config instanceof ConfiguredItem) {
      return config.config;
    }

    return notFoundValue !== undefined ? notFoundValue : config;
  }
}