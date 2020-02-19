export interface Scope {
  $destroy(): void;
  $new(isolate?: boolean): Scope;
  $watch(watcher: Function | string, callback?: Function): Function;
}

export interface Injector {
  instantiate<T>(Ctor: { new (...args: any[]): T }, locals?: { [key: string]: any }): T;
  get<T>(token: string): T;
}

export interface CompileService {
  (template: string|Node): TemplateLinkingFunction;
}

export interface TemplateCache {
  get<T>(name: string): T;
}

export interface TemplateLinkingFunction {
  (scope: Scope): any;
}