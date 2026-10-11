import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['tools/native-visual-prepare.mjs'],{stdio:'inherit'});
fs.copyFileSync('native/station-map-refine.css','native/www/station-map-refine.css');
execFileSync('python3',['tools/native-marker-refine.py'],{stdio:'inherit'});
function replaceOnce(s,old,value){assert.equal(s.split(old).length,2,'Reviewed source changed: '+old.slice(0,90));return s.replace(old,value);}
const html='native/www/index.html';let h=fs.readFileSync(html,'utf8');
h=replaceOnce(h,' if(window.FMNNearbyUI)FMNNearbyUI.syncVehicle();\n}', ' if(window.FMNNearbyUI)FMNNearbyUI.syncVehicle();\n if(applyValues!==false&&window.FMNNearbyApp)FMNNearbyApp.refreshResults();\n}');
h=replaceOnce(h,"try{persist();return true}catch(e){return false}","try{persist();if(window.FMNNearbyApp)FMNNearbyApp.refreshResults();return true}catch(e){return false}");
fs.writeFileSync(html,h);
const file='android/app/build.gradle';let text=fs.readFileSync(file,'utf8');assert(text.includes("versionCode 4; versionName '1.2.1-visual-test'"));text=text.replace("versionCode 4; versionName '1.2.1-visual-test'","versionCode 5; versionName '1.2.2-markers-test'");fs.writeFileSync(file,text);
const entry='native/www/native-entry.js';text=fs.readFileSync(entry,'utf8');assert(text.includes('Android 1.2.1 visual test'));fs.writeFileSync(entry,text.replaceAll('Android 1.2.1 visual test','Android 1.2.2 marker test'));
const cli=path.resolve('native/node_modules/@capacitor/cli/bin/capacitor');execFileSync(process.execPath,[cli,'sync','android'],{cwd:path.resolve('native'),stdio:'inherit'});
console.log('1.2.2 prepared. Same Android package, native origin, location source and saved preferences. No web deployment.');
