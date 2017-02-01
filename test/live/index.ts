import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';

import { RootLayout, Row, Column, Layout } from '../../src';

const rootLayout = RootLayout.create({
  container: document.body
})
  .configure({
    use: Layout.configure({
      child: Row.configure({
        children: [{
          use: Column
        }, {
          use: Layout.configure({
            child: Row
          })
        }]
      })  
    })
  })
  .initialize();
  

window.addEventListener('resize', () => {
  rootLayout.resize();
  rootLayout.update();
}, false);

(<any>window).rootLayout = rootLayout;