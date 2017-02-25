import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';

import { Renderable } from './dom';

export interface CrawlerStepInfo {
  node: Renderable;
  parent: Renderable|null;
}

type CrawlerPredicate = (node: Renderable) => boolean;

interface CrawlerArgs {
  lastParent: Renderable|null;
  parent: Renderable|null;
  node: Renderable;
  predicate: CrawlerPredicate;
  observer: Observer<CrawlerStepInfo>;
}

export class Crawler {
  crawl(rootNode: Renderable, predicate: CrawlerPredicate = () => true): Observable<CrawlerStepInfo> {
    return Observable.create((observer: Observer<CrawlerStepInfo>) => {
      this._crawl({
        observer,
        predicate,
        lastParent: null,
        parent: null,
        node: rootNode
      })
    });
  }

  private _crawl(info: CrawlerArgs): void {
    let { lastParent } = info;
    const { observer, node, predicate, parent } = info;
    const children = node.getChildren();

    if (predicate(node)) {
      observer.next({ node, parent: lastParent });
      lastParent = node;
    }

    for (const child of children) {
      this._crawl({
        predicate,
        lastParent,
        observer,
        node: child,
        parent: node,
      });
    }
  }
}