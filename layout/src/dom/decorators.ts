import { get } from '../utils';

export function MemoizeFrom(...properties: string[]): MethodDecorator {
  const propMap = new WeakMap();
  
  return (target: Object, name: string, descriptor: PropertyDescriptor): PropertyDescriptor => {
    const { value } = descriptor;
    let lastReturnValue;
    
    descriptor.value = function(...args: any[]): any {
      if (!propMap.has(this)) {
        propMap.set(this, {});
      }

      let props = propMap.get(this);
      let hasChanged = false;
      
      for (const prop of properties) {
        const result = get(this, prop);
        
        if (result !== props[prop]) {
          hasChanged = true;
        } 
        
        props[prop] = result;

        if (hasChanged) {
          break;
        }
      }            

      if (hasChanged) {
        lastReturnValue = value.apply(this, args);
      }

      return lastReturnValue;
    };

    return descriptor;
  };
}