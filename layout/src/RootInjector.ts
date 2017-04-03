import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';
import DOMAttrs from 'snabbdom/modules/attributes';

import { Injector, ProviderArg, forwardRef } from './di';
import { Renderer, RenderableInjector } from './dom';
import { ViewFactory, ViewManager, ViewLinker } from './view';
import { DocumentRef, PatchRef } from './common';
import { LayoutManipulator } from './layout';

const patch = snabbdom.init([
  DOMClass,
  DOMStyle,
  DOMProps,
  DOMEvents,
  DOMAttrs
]);

export class RootInjector extends RenderableInjector {
  constructor(providers: ProviderArg[] = []) {
    super([
      Renderer,
      ViewFactory,
      ViewManager,
      ViewLinker,
      LayoutManipulator,
      { provide: PatchRef, useValue: patch },
      { provide: DocumentRef, useValue: document },
      { provide: RootInjector, useValue: forwardRef(() => this) },
      ...providers
    ]);
  }
}