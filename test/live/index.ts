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
        splitterSize: 50,
        children: [{
          ratio: 25,
          use: Column.configure({
            children: [{
              use: Row,
              ratio: 10
            }, {
              use: Row
            }]
          })
        }, {
          ratio: 75,
          use: Column
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