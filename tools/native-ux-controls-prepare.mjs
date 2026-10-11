// Native build extends approved 1.2.3 package; public website/backend and GPS code unchanged.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,[path.resolve('tools/native-unified-search-prepare.mjs')],{stdio:'inherit'});
const root='native/www/';
const nearby=root+'nearby-ui.js';
let src=fs.readFileSync(nearby,'utf8');
const marker='window.FMNNearbyUI={getFilters:useFilters,';
assert.equal(src.split(marker).length-1,1,'Nearby export changed: review quick filter integration');
const code=[
'function setQuickFilters(partial){',
' const original=useFilters();',
" if(partial?.travel==='towards'){",
'  const d=window.FMNJourney?.getDestination();',
'  if(!d||d.manual)return false;',
' }',
' filters=C.normaliseFilters({...original,...partial},context().radius);',
" if(C.truckMode(context())&&['all','unknown'].includes(filters.access))filters.access='truckstops';",
" const saved=write('fmnNearbyFilters',filters);",
' reloadList();',
" if(!saved)app?.toast?.('Filters applied for this session. Device storage is unavailable.');",
' return true;',
'}',''
].join('\n');
src=src.replace(marker,code+marker.replace('getFilters:useFilters,','getFilters:useFilters,setQuickFilters,'));

const summaryStart=src.indexOf('function summary(n,total){');
const summaryEnd=src.indexOf('function modal(title)',summaryStart);
assert(summaryStart>=0&&summaryEnd>summaryStart,'Nearby summary location changed');
src=src.slice(0,summaryStart)+
 "function summary(n,total){const f=useFilters();return n+' of '+total+' stations · '+f.minKm+'–'+f.maxKm+' km'+(f.travel==='towards'?' · On my way (direction only)':'');}\n"+
 src.slice(summaryEnd);
fs.writeFileSync(nearby,src);
// Legacy map QA must navigate the user-facing buttons after Reset/Filters moved into the compact toolbar.
// Keep every station-count, height, GPS and marker assertion unchanged.
const mapTest='tools/native-map-clarity-test.cjs';let check=fs.readFileSync(mapTest,'utf8');
const moves=[
 ["await p.locator('#nearbyReset').click();","await p.locator('#fmnQuickActions button').nth(3).click();await p.locator('#fmnResetInsideFilters').click();"],
 ["await p.locator('#nearbyFilterButton').click();","await p.locator('#fmnQuickActions button').nth(3).click();"]
];
for(const [old,next] of moves){
 assert.equal(check.split(old).length-1,1,'Legacy map QA changed: review visible filter button sequence');
 check=check.replace(old,next);
}
fs.writeFileSync(mapTest,check);

for(const f of ['ux-controls.js','ux-controls.css'])fs.copyFileSync('native/'+f,root+f);
const file=root+'index.html';let html=fs.readFileSync(file,'utf8');
assert(html.includes('</head>')&&html.includes('</body>'));
html=html.replace('</head>','<link rel="stylesheet" href="/ux-controls.css"></head>');
html=html.replace('</body>','<script src="/ux-controls.js"></script></body>');
fs.writeFileSync(file,html);
const gradle='android/app/build.gradle';let g=fs.readFileSync(gradle,'utf8');
assert(g.includes("versionCode 6; versionName '1.2.3-unified-search-test'"),'The 1.2.3 package base changed');
g=g.replace("versionCode 6; versionName '1.2.3-unified-search-test'","versionCode 7; versionName '1.2.4-ux-test'");
fs.writeFileSync(gradle,g);
const entry=root+'native-entry.js';let bundle=fs.readFileSync(entry,'utf8');
assert(bundle.includes('Android 1.2.3 unified search test'));
fs.writeFileSync(entry,bundle.replaceAll('Android 1.2.3 unified search test','Android 1.2.4 UX test'));
const cap=path.resolve('native/node_modules/@capacitor/cli/bin/capacitor');
execFileSync(process.execPath,[cap,'sync','android'],{cwd:path.resolve('native'),stdio:'inherit'});
console.log('Native 1.2.4 prepared. GPS provider, pricing/ranking, station data, original art and public web unchanged.');

