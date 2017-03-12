import { ViewConfig } from './common';

export abstract class ViewFactoryInterceptor {
  config(conf: ViewConfig): ViewConfig {
    return conf;  
  }
}