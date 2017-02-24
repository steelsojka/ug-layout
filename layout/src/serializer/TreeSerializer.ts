import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { Crawler } from '../Crawler';
import { isSerializable, Serialized } from './common';
import { Serializer } from './Serializer';

export class TreeSerializer<T extends Renderable, S extends Serialized> extends Serializer<T, S>{
  serialize(node: T): S {
    Crawler.crawl(node)
      .filter(isSerializable)
      .subscribe()
  }

  deserialize(node: S): RenderableArg<T> {
    
  }
}