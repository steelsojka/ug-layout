import { clamp } from '../utils';

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

  get x(): number { return this._x; }
  set x(v: number) {
    this._x = v;
    this._calculate();
  }
  
  get x2(): number { return this._x2; }
  set x2(v: number) {
    this._x2 = v;
    this._calculate();
  }
  get y(): number { return this._y; }
  set y(v: number) {
    this._y = v;
    this._calculate();
  }
  
  get y2(): number { return this._y2; }
  set y2(v: number) {
    this._y2 = v;
    this._calculate();
  }

  get width(): number {
    return this._width;
  }
  
  get height(): number {
    return this._height;
  }
  
  get surface(): number {
    return this._surface;
  }

  clampX(x: number): number {
    return clamp(x, this.x, this.x2);
  }
  
  clampY(y: number): number {
    return clamp(y, this.y, this.y2);
  }

  private _calculate(): void {
    this._height = this._y2 - this._y;
    this._width = this._x2 - this._x;
    this._surface = this._height * this._width;
  }
}