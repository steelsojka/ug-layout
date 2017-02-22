import { OpaqueToken, Type } from '@angular/core';
import { 
  ViewComponentConfig as _ViewComponentConfig
} from 'ug-layout';

export const Angular1GlobalRef = new OpaqueToken('NG1GlobalREf');
export const UgLayoutModuleConfigRef = new OpaqueToken('UgLayoutModuleConfig');
export const RootLayoutProviders = new OpaqueToken('RootLayoutProviders');

export const PRIVATE_PREFIX = '__$'
export const COMPONENT_REF_KEY = `${PRIVATE_PREFIX}componentRef__`;
export const SCOPE_REF_KEY = `${PRIVATE_PREFIX}scope__`;

export interface UgLayoutModuleConfiguration {
  hybrid?: boolean;
  factories?: Map<string, Type<any>>;
}

export interface ViewComponentConfig extends _ViewComponentConfig {
  /**
   * Uses Angular 1 to compile this component. Requires `@angular/upgrade` to be used in the application.
   * @type {boolean}
   */
  upgrade: boolean;
  /**
   * The template URL to use for this component. This will be pulled from the `$templateCache` service.
   * This is ONLY used when upgrading an NG1 component since there is no metadata compared to an NG2 component.
   * @type {string}
   */
  templateUrl?: string;
  /**
   * The template to use for this component. This is ONLY used when upgrading an NG1 component since 
   * there is no metadata compared to an NG2 component. This takes priority over `templateUrl`.
   * @type {string}
   */
  template?: string;
  /**
   * The controller name to use in templates. Uses `$ctrl` by default. This is ONLY used when upgrading
   * an NG1 component.
   * @type {string}
   */
  controllerAs?: string;
}

export type ViewComponentConfigArgs = {
  [P in keyof ViewComponentConfig]?: ViewComponentConfig[P];
}

