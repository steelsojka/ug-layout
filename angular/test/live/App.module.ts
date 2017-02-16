import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import angular from 'angular';

import { UgLayoutModule } from '../../src';
import { AppComponent } from './App.component';
import { TestComponent } from './Test.component';

@NgModule({
  imports: [
    BrowserModule, 
    UgLayoutModule.forRoot({ hybrid: true })
  ],
  declarations: [ AppComponent, TestComponent ],
  entryComponents: [ TestComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}