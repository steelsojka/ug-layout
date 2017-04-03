import { Renderable } from './dom';

export interface TagQueryOptions {
  all?: boolean;
}

export class TagUtil {
  static query(root: Renderable, tags: string[], options?: TagQueryOptions): Renderable[] {
    return this.matches([ root, ...root.getDescendants() ], tags, options);
  }

  static matches(items: Renderable[], tags: string[], options?: TagQueryOptions): Renderable[] {
    return items.filter(item => this.matchesTags(item, tags));
  }

  static matchesTags(item: Renderable, tags: string[], options: TagQueryOptions  = {}): boolean {
    const { all = false } = options;
    
    return all 
      ? tags.every(t => item.tags.has(t))
      : tags.some(t => item.tags.has(t));
  }
}