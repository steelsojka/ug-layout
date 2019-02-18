import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { UpgradeModule } from '@angular/upgrade/static';
import angular from 'angular';

import { UgLayoutModule } from '../../src';
import { AppComponent } from './App.component';
import { TestComponent } from './Test.component';

@NgModule({
  imports: [
    UpgradeModule,
    BrowserModule,
    UgLayoutModule
  ],
  declarations: [ AppComponent, TestComponent ],
  entryComponents: [ TestComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}