import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { UgLayoutModule } from '../../src';
import { AppComponent } from './App.component';
import { TestComponent } from './Test.component';

@NgModule({
  imports: [ BrowserModule, UgLayoutModule ],
  declarations: [ AppComponent, TestComponent ],
  entryComponents: [ TestComponent ],
  bootstrap: [ AppComponent ]
})
export class AppModule {}