import { Inject, Component, Input, Output, EventEmitter } from '@angular/core';
import { ViewComponent, ViewContainer, ResolverStrategy } from 'ug-layout';

@ViewComponent({
  name: 'test',
  resolution: ResolverStrategy.REF
})
@Component({
  selector: 'test',
  template: `
    <div>
      <h1>This is a test</h1>
      <div *ngIf="show">{{ number }}</div>
    </div>
  `
})
export class TestComponent {
  private _show: boolean = true;
  private number: number = Math.random();

  test: number = 0;

  constructor(
    @Inject(ViewContainer) private _viewContainer: ViewContainer<TestComponent>
  ) {
    window['component'] = this;
  }

  get show(): boolean {
    return this._show;
  }

  @Input()
  set show(val: boolean) {
    this._show = val;
  }

  @Output() shown: EventEmitter<boolean> = new EventEmitter();

  ngOnInit(): void {
    setInterval(() => {
      this.number++;
    }, 1000);
  }
}
