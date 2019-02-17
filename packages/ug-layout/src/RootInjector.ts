import * as snabbdom from 'snabbdom';
import DOMClass from 'snabbdom/modules/class';
import DOMStyle from 'snabbdom/modules/style';
import DOMProps from 'snabbdom/modules/props';
import DOMEvents from 'snabbdom/modules/eventlisteners';
import DOMAttrs from 'snabbdom/modules/attributes';

import { ProviderArg, forwardRef } from './di';
import { Renderer, RenderableInjector } from './dom';
import { ViewFactory, ViewManager, ViewLinker, ViewHookExecutor } from './view';
import { DocumentRef, PatchRef, WindowRef } from './common';
import { LayoutManipulator } from './layout';
import { LockState } from './LockState';
import {
  StackTab,
  StackHeader,
  StackItemContainer,
  Stack,
  STACK_TAB_CLASS,
  STACK_HEADER_CLASS,
  STACK_ITEM_CONTAINER_CLASS,
  STACK_CLASS
} from './stack';
import {
  XYItemContainer,
  Column,
  Row,
  Splitter,
  COLUMN_CLASS,
  ROW_CLASS,
  XY_ITEM_CONTAINER_CLASS,
  SPLITTER_CLASS
} from './XYContainer';
import {
  ViewContainer,
  VIEW_CONTAINER_CLASS
} from './view';

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
      LockState,
      ViewHookExecutor,
      { provide: STACK_TAB_CLASS, useValue: StackTab },
      { provide: STACK_HEADER_CLASS, useValue: StackHeader },
      { provide: STACK_ITEM_CONTAINER_CLASS, useValue: StackItemContainer },
      { provide: STACK_CLASS, useValue: Stack },
      { provide: XY_ITEM_CONTAINER_CLASS, useValue: XYItemContainer },
      { provide: ROW_CLASS, useValue: Row },
      { provide: COLUMN_CLASS, useValue: Column },
      { provide: SPLITTER_CLASS, useValue: Splitter },
      { provide: VIEW_CONTAINER_CLASS, useValue: ViewContainer },
      { provide: PatchRef, useValue: patch },
      { provide: DocumentRef, useValue: document },
      { provide: WindowRef, useValue: window },
      ...providers,
      { provide: RootInjector, useValue: forwardRef(() => this) }
    ]);
  }
}