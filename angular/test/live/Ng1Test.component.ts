import { ViewComponent, Detect } from '../../src';

@ViewComponent({
  upgrade: true,
  template: `<div>Hi {{$ctrl.name}}</div>`
})
export class Ng1TestComponent {
  @Detect()
  name: string = 'Steven';

  constructor() {
    window['ng1Comp'] = this;
  }

  $onInit() {
    console.log('INIT!');
  }
}