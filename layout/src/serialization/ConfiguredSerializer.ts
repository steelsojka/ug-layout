import { ConfiguredItem } from '../ConfiguredItem';
import { SerializerConfig, Serializer } from './Serializer';
import { SerializerContainer } from './SerializerContainer';

export class ConfiguredSerializer<T extends typeof Serializer, C extends SerializerConfig> extends ConfiguredItem<T, C> {
  constructor(
    item: T, 
    config: C,
    private _register?: (container: SerializerContainer) => void
  ) {
    super(item, config);
  }

  register(container: SerializerContainer) {
    if (this._register) {
      this._register(container);
    }
  }
}