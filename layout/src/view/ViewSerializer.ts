import { ConfiguredRenderable, SerializedRenderable } from '../dom';
import { Inject } from '../di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from '../serialization';
import { View } from './View';
import { isBoolean, isNumber } from '../utils';
import { ResolverStrategy, CacheStrategy } from './common';
import { ConfiguredItem } from '../ConfiguredItem';

export interface SerializedView extends SerializedRenderable {
  lazy: boolean|null;
  ref: string|null;
  caching?: CacheStrategy|null;
  token: string;
  useClass: string;
  resolution: ResolverStrategy|null;
  viewComponentConfig: any;
}

export class ViewSerializer implements Serializer<View, SerializedView> {
  @Inject(SerializerContainer) private _container: SerializerContainer;
  
  serialize(node: View): SerializedView {
    const token = this._container.resolveClassString(node.token);

    if (!token) {
      throw new Error('Can not serialize view with no registered token.');
    }
    
    return {
      token,
      name: 'View',
      tags: [ ...node.tags ],
      ref: node.ref,
      caching: node.caching != null ? node.caching : undefined,
      lazy: node.lazy,
      useClass: token,
      resolution: node.resolution,
      viewComponentConfig: node.viewComponentConfig
    };
  }

  deserialize(node: SerializedView): ConfiguredRenderable<View> {
    const token = this._container.resolveClass(node.token);
    const useClass = this._container.resolveClass(node.useClass);

    if (!token || !useClass) {
      throw new Error('Could not resolve view classes.');
    }
    
    return View.configure({
      token, 
      useClass: new ConfiguredItem(useClass, node.viewComponentConfig),
      caching: node.caching != null ? node.caching : undefined,
      lazy: isBoolean(node.lazy) ? node.lazy : undefined,
      resolution: isNumber(node.resolution) ? node.resolution : undefined,
      ref: node.ref,
      tags: node.tags
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('View', View);
  }
}