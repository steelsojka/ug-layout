import { ConfiguredRenderable } from '../dom';
import { Inject } from '../di';
import { GenericSerializer, SerializerContainer, Serializer, Serialized } from '../serialization';
import { View } from './View';

export interface SerializedView extends Serialized {
  lazy: boolean;
  token: string;
  useClass: string;
}

export class ViewSerializer implements Serializer<View, SerializedView> {
  constructor(
    @Inject(SerializerContainer) private _container: SerializerContainer
  ) {}
  
  serialize(node: View): SerializedView {
    const token = this._container.resolveClassString(node.token);

    if (!token) {
      throw new Error('Can not serialize view with no registered token.');
    }
    
    return {
      token,
      name: 'View',
      lazy: node.lazy,
      useClass: token
    };
  }

  deserialize(node: SerializedView): ConfiguredRenderable<View> {
    const token = this._container.resolveClass(node.token);
    const useClass = this._container.resolveClass(node.useClass);

    if (!token || !useClass) {
      throw new Error('Could not resolve view classes.');
    }
    
    return View.configure({
      token, useClass,
      lazy: node.lazy
    });
  }

  static register(container: SerializerContainer): void {
    container.registerClass('View', View);
  }
}