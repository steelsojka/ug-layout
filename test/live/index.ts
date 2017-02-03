import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';

import { RootLayout, Row, Column, Layout, View } from '../../src';

const rootLayout = RootLayout.create({
  container: document.body
})
  .configure({
    use: Layout.configure({
      child: Row.configure({
        children: [{
          ratio: 25,
          use: Column.configure({
            children: [{
              use: View,
              ratio: 10
            }, {
              use: Row
            }, {
              use: View
            }]
          })
        }, {
          ratio: 75,
          use: View
        }]
      })  
    })
  })
  .initialize();
  

window.addEventListener('resize', () => {
  rootLayout.resize({
    height: window.innerHeight,
    width: window.innerWidth
  });
  
  rootLayout.update();
}, false);

(<any>window).rootLayout = rootLayout;