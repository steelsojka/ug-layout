import { Inject, Optional } from '../di';
import { ContainerRef, ConfigurationRef } from '../common';
import { View, ViewConfig } from './View';
import { ViewFactoriesRef } from './common';

export class ViewContainer {
  constructor(
    @Inject(ContainerRef) private _container: View,
  ) {}
}