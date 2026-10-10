/* Test-only: browser layout harness cannot run an Android runtime. Not used in APK preparation or Android instrumentation. */
'use strict';
const fs=require('node:fs');const original=fs.readFileSync;
fs.readFileSync=function(file,...args){const value=original.call(this,file,...args);if(String(file).replaceAll('\\','/').endsWith('/native/www/native-entry.js')){const text=String(value).replace('if (!Capacitor.isNativePlatform()) throw new Error("This bundle requires the installed Android app.");','/* Browser-only visual fixture; real APK guard remains unchanged. */');return Buffer.isBuffer(value)?Buffer.from(text):text;}return value;};
