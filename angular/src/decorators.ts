import { ComponentRef } from '@angular/core';
import { 
  ViewComponent as _ViewComponent, 
  VIEW_CONFIG_KEY
} from 'ug-layout';

import { 
  COMPONENT_REF_KEY, 
  PRIVATE_PREFIX, 
  ViewComponentConfigArgs,
  SCOPE_REF_KEY
} from './common';

const noop = function() {};

export function ViewComponent(config?: ViewComponentConfigArgs): ClassDecorator {
  return (target: Function) => {
    _ViewComponent(target);

    const metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, target);

    Reflect.defineMetadata(VIEW_CONFIG_KEY, Object.assign({ upgrade: false }, metadata, config), target);
  };
}

export function Detect(options: { key?: string } = {}): PropertyDecorator {
  return (target: Object, key: string, descriptor?: PropertyDescriptor) => {
    let setter: (v: any) => void = noop;
    let getter: () => any = noop;
    let metadata;
    

    let newDescriptor: PropertyDescriptor = { configurable: true };
    
    if (descriptor) {
      if (descriptor.set) {
        setter = descriptor.set;
      }

      if (descriptor.get) {
        getter = descriptor.get;
      }
    } else {
      getter = function(): any {
        return this[`${PRIVATE_PREFIX}${key}`];
      };

      setter = function(v: any) {
        this[`${PRIVATE_PREFIX}${key}`] = v;
      };
    }

    if (setter !== noop) {
      newDescriptor.set = function(v: any): void {
        setter.call(this, v);

        if (!metadata) {
          metadata = Reflect.getOwnMetadata(VIEW_CONFIG_KEY, target.constructor) || {};
        }

        if (metadata.upgrade) {
          const scope = this[SCOPE_REF_KEY] as ng.IScope|undefined;

          if (scope) {
            scope.$applyAsync();
          }
        } else {
          const componentRef = this[COMPONENT_REF_KEY] as ComponentRef<any>|undefined;
          
          if (componentRef) {
            componentRef.changeDetectorRef.detectChanges();
          }
        }
      }
    }
    
    if (getter !== noop) {
      newDescriptor.get = getter;
    }

    return newDescriptor;
  };
}