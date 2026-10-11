import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {badges,showAccessCheck,navigate} from '../native/compact-access.mjs';
execFileSync(process.execPath,['tools/native-truck-network-prepare.mjs'],{stdio:'inherit'});
const root='native/www/';
for(const name of ['compact-features.js','compact-features.css'])fs.copyFileSync('native/'+name,root+name);
const file=root+'index.html';let html=fs.readFileSync(file,'utf8');
assert.equal(html.split('attributionControl:true').length-1,1);
html=html.replace('attributionControl:true','attributionControl:false');
const navigation='map.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");';
assert(html.includes(navigation));html=html.replace(navigation,'map.addControl(new maplibregl.AttributionControl({compact:false}),"bottom-left");');
html=html.replace('</head>','<link rel="stylesheet" href="/compact-features.css"></head>').replace('</body>','<script src="/compact-features.js"></script></body>');
html=html.replace('$("topArea").focus()','$("mapFiltersQuick").focus()').replaceAll('Value comparison only · truck access needs checking','Truck access unverified');fs.writeFileSync(file,html);
let nearby=fs.readFileSync(root+'nearby-ui.js','utf8');
for(const [fn,next] of [[badges,'function buildTruck('],[showAccessCheck,'function installOptionsFooter('],[navigate,'// Destination selection']]){
 const start=nearby.indexOf('function '+fn.name+'('),end=nearby.indexOf(next,start);assert(start>=0&&end>start,'Review compact '+fn.name+' boundary');nearby=nearby.slice(0,start)+fn.toString()+'\n'+nearby.slice(end);
}
nearby=nearby.replaceAll('A green price badge means value, not truck clearance.','');
const brief=[
 ['No verified height records match your ', 'No recorded height match for your '],
 [' m truck with a 0.1 m allowance. No measured match is recorded. Select Truck facilities to browse recorded truck stops without claiming a height match.',' m truck. Choose Truck facilities to browse listed stops.'],
 ['No recorded truck facilities match this area and these filters. Expand the radius or change the destination filter. Our facility directory is incomplete; other stations are not substituted.','No listed truck facilities match. Expand the radius or adjust filters.'],
 ['No stations have current access records matching your complete truck profile. Select Truck facilities to browse recorded truck stops without claiming a dimensional match.','No recorded full-fit matches. Choose Truck facilities to browse listed stops.'],
 ['Your dimensions stay on this device. A station brand or diesel pump is not evidence that your truck will fit.','Your dimensions stay on this device.'],
 ['Use the highest loaded point, operating width (including projecting equipment), full length including trailers, and total loaded weight. This is not a permit or legal-access check.','Include loaded height, projecting equipment, trailers and total loaded weight.'],
 ['Truck-stop listings do not confirm your dimensions. Check the entrance, fuel-bay clearance and exit with the operator before travel. Standard directions are not truck routing.','Confirm entrance, clearance and turning space with the operator.']
];for(const [old,next] of brief)nearby=nearby.replaceAll(old,next);fs.writeFileSync(root+'nearby-ui.js',nearby);
let search=fs.readFileSync(root+'unified-search.js','utf8');for(const [old,next] of [
 ['Your saved settings are used throughout the app.','Changes save on this device.'],
 ['Saved. These settings are used for Best Stop and nearby prices.','Saved.'],
 ['Truck facilities are listed separately from confirmed height and route clearance. Check access details before travelling.','Use your actual loaded dimensions.'],
 ['Vehicle selected. Check your fill and dimensions below.','Vehicle selected.']])search=search.replaceAll(old,next);fs.writeFileSync(root+'unified-search.js',search);
let journey=fs.readFileSync(root+'journey.js','utf8');journey=journey.replaceAll('This opens standard Google Maps directions. FillMeNow has not checked road detours, backtracking or truck restrictions. Review the route before driving.','Choose your destination in Google Maps.').replaceAll('No destination selected. Nearby search still works.','Choose a destination below.');fs.writeFileSync(root+'journey.js',journey);
const gradle='android/app/build.gradle';let g=fs.readFileSync(gradle,'utf8');assert(g.includes("versionCode 8; versionName '1.2.5-truck-network-test'"));fs.writeFileSync(gradle,g.replace("versionCode 8; versionName '1.2.5-truck-network-test'","versionCode 9; versionName '1.2.6-compact-features-test'"));
const entry=root+'native-entry.js';let bundle=fs.readFileSync(entry,'utf8');assert(bundle.includes('Android 1.2.5 truck network test'));fs.writeFileSync(entry,bundle.replaceAll('Android 1.2.5 truck network test','Android 1.2.6 compact features test'));
// The existing browser suites enter the same form through its new visible control.
for(const name of ['native-unified-search-test.cjs','native-ux-controls-test.cjs','native-map-clarity-test.cjs']){
 const p='tools/'+name;let test=fs.readFileSync(p,'utf8').replaceAll("locator('#topArea')","locator('#mapFiltersQuick')");
 test=test.replace('()=>!!window.FMNUnifiedSearch&&','()=>window.FMNFeatures?.ready&&!!window.FMNUnifiedSearch&&').replace('()=>window.FMNMapClarity&&','()=>window.FMNFeatures?.ready&&window.FMNMapClarity&&');
 test=test.replace("['Your vehicle & fuel','Your location & journey']","['Vehicle & fuel','Location & journey']");
 if(name==='native-map-clarity-test.cjs')test=test.replace("await p.locator('#mapFiltersQuick').click();await p.locator('#nearbyDialog[open]').waitFor();await p.locator('.nearby-back').click();","await p.locator('#mapFiltersQuick').click();await p.locator('#areaModal.open').waitFor();await p.locator('#areaClose').click();");
 fs.writeFileSync(p,test);
}
for(const name of ['NativeMapTest.java','NativePolishTest.java']){
 const p='android/app/src/androidTest/java/au/com/fillmenow/app/'+name;let test=fs.readFileSync(p,'utf8').replaceAll('tap("#topArea")','tap("#mapFiltersQuick")');fs.writeFileSync(p,test);
}
const cap=path.resolve('native/node_modules/@capacitor/cli/bin/capacitor');execFileSync(process.execPath,[cap,'sync','android'],{cwd:path.resolve('native'),stdio:'inherit'});
console.log('Native 1.2.6 prepared: compact Features, header Locate, gesture zoom and visible inline map attribution.');
