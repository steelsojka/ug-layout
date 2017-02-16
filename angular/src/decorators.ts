import { ComponentRef } from '@angular/core';

import { COMPONENT_REF_KEY, PRIVATE_PREFIX } from './common';

const noop = function() {};

export function Detect(options: { key?: string } = {}): PropertyDecorator {
  return (target: Object, key: string, descriptor?: PropertyDescriptor) => {
    let setter: (v: any) => void = noop;
    let getter: () => any = noop;

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

        const componentRef = this[COMPONENT_REF_KEY] as ComponentRef<any>|undefined;
        
        if (componentRef) {
          componentRef.changeDetectorRef.detectChanges();
        }
      }
    }
    
    if (getter !== noop) {
      newDescriptor.get = getter;
    }

    return newDescriptor;
  };
}