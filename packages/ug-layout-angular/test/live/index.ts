/// <reference path="./index.d.ts" />

import 'babel-polyfill';
import 'zone.js';
import 'reflect-metadata';
import 'ug-layout/src/styles/core.css';
import './index.css';
import angular from 'angular';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { UpgradeModule } from '@angular/upgrade/static';
import { AppModule } from './App.module';
import { Observable } from 'rxjs/Rx';

const ng1App = angular.module('app', []);

platformBrowserDynamic().bootstrapModule(AppModule).then(platformRef => {
  const upgrade = platformRef.injector.get(UpgradeModule);

  upgrade.bootstrap(document.body, [ng1App.name], { strictDi: true });
});
 
