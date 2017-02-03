import 'reflect-metadata';
import '../../src/styles/core.css';
import './index.css';

import { RootLayout, Row, Column, Layout, View, Stack } from '../../src';

const rootLayout = RootLayout.create({
  container: document.body
})
  .configure({
    use: Layout.configure({
      child: Stack.configure({
        children: [{
          use: Row.configure({
            children: [{
              use: View
            }, {
              use: View
            }]
          }),
          title: 'Test View 1'
        }, {
          use: Stack.configure({
            children: [{
              title: 'NESTED 1',
              use: Column.configure({
                children: [{
                  use: View
                }, {
                  use: View
                }]
              })
            }, {
              use: View,
              title: 'NESTED 2'
            }]
          }),
          title: 'Test View 2'
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