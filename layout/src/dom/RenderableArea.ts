import { clamp } from '../utils';

/**
 * A class that defines an area in pixels.
 * @export
 * @class RenderableArea
 */
export class RenderableArea {
  private _width: number;
  private _height: number;
  private _surface: number;

  constructor(
    private _x: number = 0, 
    private _x2: number = 0, 
    private _y: number = 0, 
    private _y2: number = 0
  ) {
    this._calculate();
  }

  /**
   * The left x position.
   * @type {number}
   */
  get x(): number { return this._x; }
  set x(v: number) {
    this._x = v;
    this._calculate();
  }
  
  /**
   * The right x position.
   * @type {number}
   */
  get x2(): number { return this._x2; }
  set x2(v: number) {
    this._x2 = v;
    this._calculate();
  }
  
  /**
   * The top y position.
   * @type {number}
   */
  get y(): number { return this._y; }
  set y(v: number) {
    this._y = v;
    this._calculate();
  }
  
  /**
   * The bottom y position.
   * @type {number}
   */
  get y2(): number { return this._y2; }
  set y2(v: number) {
    this._y2 = v;
    this._calculate();
  }

  /**
   * The width of the area.
   * @readonly
   * @type {number}
   */
  get width(): number {
    return this._width;
  }
  
  /**
   * The height of the area.
   * @readonly
   * @type {number}
   */
  get height(): number {
    return this._height;
  }
  
  /**
   * The surface of the area.
   * @readonly
   * @type {number}
   */
  get surface(): number {
    return this._surface;
  }

  /**
   * Clamps a value to the x axis bounds. (x, x2)
   * @param {number} x 
   * @returns {number} 
   */
  clampX(x: number): number {
    return clamp(x, this.x, this.x2);
  }
  
  /**
   * Clamps a value to the y axis bounds. (y, y2)
   * @param {number} y
   * @returns {number} 
   */
  clampY(y: number): number {
    return clamp(y, this.y, this.y2);
  }

  private _calculate(): void {
    this._height = this._y2 - this._y;
    this._width = this._x2 - this._x;
    this._surface = this._height * this._width;
  }
}