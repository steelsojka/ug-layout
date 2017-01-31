import 'reflect-metadata';

import { RootLayout } from '../../src';

const container = document.createElement('div');
document.body.appendChild(container);

const rootLayout = new RootLayout({
  container 
});

rootLayout.initialize();

(<any>window).rootLayout = rootLayout;