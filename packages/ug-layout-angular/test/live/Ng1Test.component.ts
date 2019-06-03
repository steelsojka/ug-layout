import { ViewComponent } from '../../src';

@ViewComponent({
  upgrade: true,
  template: `<div>Hi {{$ctrl.name}}</div>`
})
export class Ng1TestComponent {
  name: string = 'Steven';

  constructor() {
    window['ng1Comp'] = this;
  }

  $onInit() {
    console.log('INIT!');
  }
}
