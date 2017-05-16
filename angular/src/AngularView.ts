import {
  View,
  ConfiguredRenderable,
  TagUtil,
  ViewConfig,
  PostConstruct
} from 'ug-layout';

import { ANGULAR_TAG } from './common';

export class AngularView extends View {
  @PostConstruct()
  initialize(): void {
    TagUtil.addTags(this._configuration, [ ANGULAR_TAG ], { initSet: false });

    super.initialize();
  }

  static configure(config: ViewConfig): ConfiguredRenderable<AngularView> {
    return new ConfiguredRenderable(AngularView, config);
  }
}