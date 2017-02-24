import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { Renderable } from './dom';

export class Crawler {
  static crawl(rootNode: Renderable): Observable<Renderable> {
    return Observable.create((observer: Observer<Renderable>) => {
      observer.next(rootNode);
      
      rootNode.getDescendants().forEach(node => observer.next(node));
    });
  }
}