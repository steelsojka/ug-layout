import { ProviderArg } from './di';
import { RootLayout } from './RootLayout';

export interface UgPlugin {
  initialize?(root: RootLayout): void; 
  configureProviders?(providers: ProviderArg[]): ProviderArg[];
}