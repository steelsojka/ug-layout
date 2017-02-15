import 'babel-polyfill';
import 'zone.js';
import 'reflect-metadata';
import 'ug-layout/src/styles/core.css';
import './index.css';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './App.module';
import { Observable } from 'rxjs/Rx';

platformBrowserDynamic().bootstrapModule(AppModule);
