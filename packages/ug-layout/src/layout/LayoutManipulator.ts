import { Observable, Observer } from 'rxjs';

import { Type } from '../di';
import { Renderable } from '../dom';
import { RenderableArg } from '../common';
import { TagUtil } from '../TagUtil';

export enum LayoutInsertPosition {
  FURTHEST,
  CLOSEST
}

export interface LayoutInsertArgs {
  insert: RenderableArg<Renderable>;
  from: Renderable;
  into: Type<Renderable>|Type<Renderable>[];
  position?: LayoutInsertPosition;
  index?: number;
  tag?: string;
}

export class LayoutManipulator {
  insert(args: LayoutInsertArgs): Observable<Renderable> {
    return Observable.create((observer: Observer<Renderable>) => {
      const { from, insert, into, index = -1, position = LayoutInsertPosition.CLOSEST } = args;

      const parents = from.getParents(into);
      const container = position === LayoutInsertPosition.CLOSEST ? parents[0] : parents[parents.length - 1];

      if (container) {
        let child = args.tag ? TagUtil.matches(container.getChildren(), [ args.tag ])[0] : null;

        if (!child) {
          child = container.createChild(insert);

          container.addChild(child, {
            index: index === -1 ? container.getChildren().length : index
          });

          if (args.tag) {
            child.tags.add(args.tag);
          }
        }

        observer.next(child);
      }

      observer.complete();
    });
  }
}