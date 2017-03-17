import { ViewConfig, ViewComponentConfig } from './common';
import { ViewContainer } from './ViewContainer';

export interface ViewInterceptor {
  config?(config: ViewConfig): ViewConfig;
}