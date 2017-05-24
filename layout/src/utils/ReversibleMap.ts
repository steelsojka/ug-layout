/**
 * A map that creates a reverse entry for each item that gets set.
 * @export
 * @template T The key type.
 * @template U The value type.
 * @extends Map<T|U, T|U>
 */
export class ReversibleMap<T, U> {
  private _map: Map<T | U, T | U> = new Map();

  constructor(entries: Array<[T, U]> = []) {
    for (const [ key, value ] of entries) {
      this.set(key, value);
    }
  }

  set(key: T | U, value: T | U): this {
    this._map.set(key, value);
    this._map.set(value, key);

    return this;
  }

  get(key: T | U): T | U | undefined {
    return this._map.get(key);
  }

  has(key: T | U): boolean {
    return this._map.has(key);
  }

  delete(key: T): boolean {
    if (this.has(key)) {
      const value = this.get(key);

      this._map.delete(key);

      if (value) {
        this._map.delete(value);
      }

      return true;
    }

    return false;
  }
}
