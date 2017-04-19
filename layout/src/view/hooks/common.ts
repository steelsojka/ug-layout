export const VIEW_HOOK_METADATA = 'ugLayout:ViewHookMetadata';

export type ViewHookMetadata = { [key: string]: string[] };

export interface ViewOnResolve {
  ugOnResolve(args: { fromCache: boolean }): any;
}