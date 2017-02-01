import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';

import { RootLayout } from '../../src';

const rootLayout = RootLayout.create({
  container: document.body
});

rootLayout.initialize();

(<any>window).rootLayout = rootLayout;