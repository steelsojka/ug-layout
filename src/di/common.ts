export interface Provider {
  provide: any;
  useClass?: any;
  useValue?: any;
  useFactory?: Function;
  deps?: any[];
}

export const INJECT_PARAM_KEY = 'ugLayout:injections';