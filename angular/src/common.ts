import { OpaqueToken, Type } from '@angular/core';

export const Angular1GlobalRef = new OpaqueToken('NG1GlobalREf');
export const UgLayoutModuleConfigRef = new OpaqueToken('UgLayoutModuleConfig');
export const RootLayoutProviders = new OpaqueToken('RootLayoutProviders');

export const PRIVATE_PREFIX = '__$'
export const COMPONENT_REF_KEY = `${PRIVATE_PREFIX}componentRef__`;

export interface UgLayoutModuleConfiguration {
  hybrid?: boolean;
  factories?: Map<string, Type<any>>;
}
