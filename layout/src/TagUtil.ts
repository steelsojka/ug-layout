import { Renderable } from './dom';

export interface TagQueryOptions {
  all?: boolean;
}

export interface Taggable {
  tags?: Set<string> | string[];
}

export class TagUtil {
  static query(root: Renderable, tags: string[], options?: TagQueryOptions): Renderable[] {
    return TagUtil.matches([ root, ...root.getDescendants() ], tags, options) as Renderable[];
  }

  static matches<T extends Taggable>(items: T[], tags: string[], options?: TagQueryOptions): T[] {
    return items.filter(item => TagUtil.matchesTags(item, tags, options));
  }

  static matchesTags<T extends Taggable>(item: T, tags: string[] = [], options: TagQueryOptions  = {}): boolean {
    const { all = false } = options;
    const itemTags = item.tags || [];
    
    return all 
      ? tags.every(t => TagUtil.has(itemTags, t))
      : tags.some(t => TagUtil.has(itemTags, t));
  }

  static has(list: Set<string> | string[], item: string): boolean {
    if (list instanceof Set) {
      return list.has(item);
    }

    return list.indexOf(item) !== -1;
  }

  static add(list: Set<string> | string[], item: string): void {
    if (list instanceof Set) {
      list.add(item);
    } else {
      list.push(item);
    }
  }

  static addTags<T extends Taggable>(item: T, tags: string[], options: { initSet?: boolean } = {}): void {
    const { initSet = true } = options;
    const itemTags = item.tags;

    if (itemTags) {
      tags.forEach(tag => TagUtil.add(itemTags, tag));
    } else if (initSet) {
      item.tags = new Set(tags);
    } else {
      item.tags = [ ...tags ];
    }
  }
}