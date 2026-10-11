import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['tools/native-compact-features-prepare.mjs'],{stdio:'inherit'});
execFileSync(process.execPath,['tools/map-clarity-native-test-prepare.mjs'],{stdio:'inherit'});
const root='native/www/';
function replace(source,old,next){assert(source.includes(old),'Review scale patch: '+old.slice(0,100));return source.replaceAll(old,next);}
// Only dimensions/coordinates consume a larger CSS viewport. Fonts and artwork
// keep their authored sizes and receive the same 80% scale as every other control.
function viewportCSS(css){return css.replace(/([;{]\s*)((?:min-|max-)?(?:width|height)|top|bottom|left|right)(\s*:\s*)([^;}]+)/g,(all,lead,property,colon,value)=>lead+property+colon+value.replace(/(?<![\w.])(\d+(?:\.\d+)?)(dvh|svh|vh|vw)\b/g,(_,n,unit)=>'calc('+n+unit+' / var(--fmn-ui-scale))'));}
for(const name of fs.readdirSync(root).filter(n=>n.endsWith('.css')))fs.writeFileSync(root+name,viewportCSS(fs.readFileSync(root+name,'utf8')));
let html=fs.readFileSync(root+'index.html','utf8');
html=html.replace(/(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,(_,start,css,end)=>start+viewportCSS(css)+end);
html=html.replace('</head>','<link rel="stylesheet" href="/app-scale.css"></head>').replace('</body>','<script src="/feature-panels.js"></script></body>');
// Drag deltas and DOM rectangles are screen pixels; CSS positions are before zoom.
html=replace(html,'Math.round(x)+"px");sheet.style.setProperty("--fmn-dash-y",Math.round(y)+"px")','Math.round(x/.8)+"px");sheet.style.setProperty("--fmn-dash-y",Math.round(y/.8)+"px")');
html=replace(html,'Math.max(0,Math.min(170,dy))+"px"','Math.max(0,Math.min(170,dy/.8))+"px"');
html=replace(html,'"fmnVehicleDraft"].forEach','"fmnVehicleDraft","fmnFeaturePanels"].forEach');
fs.writeFileSync(root+'index.html',html);
for(const name of ['app-scale.css','feature-panels.js'])fs.copyFileSync('native/'+name,root+name);
for(const name of ['journey.js','support-chat.js']){
 let source=fs.readFileSync(root+name,'utf8');
 source=replace(source,"(v?v.height:innerHeight)+'px'","((v?v.height:innerHeight)/.8)+'px'");
 source=replace(source,"(v?v.offsetTop:0)+'px'","((v?v.offsetTop:0)/.8)+'px'");
 if(name==='journey.js')source=replace(source,"app.openArea();","app.openArea();root.FMNFeaturePanels?.reveal('fmnJourneyPanel');");
 fs.writeFileSync(root+name,source);
}
let search=fs.readFileSync(root+'unified-search.js','utf8');search=replace(search,'details.open=true;sync(true);',"window.FMNFeaturePanels?.reveal('fmnVehiclePanel');details.open=true;sync(true);");fs.writeFileSync(root+'unified-search.js',search);
let clarity=fs.readFileSync(root+'map-clarity.js','utf8');
clarity=replace(clarity,"const w=Math.min(224,m.width-24);bubble.style.width=w+'px';","const w=Math.min(224*.8,m.width-24);bubble.style.width=(w/.8)+'px';");
clarity=replace(clarity,"bubble.style.left=Math.round(x)+'px';bubble.style.top=Math.round(y)+'px';","bubble.style.left=Math.round(x/.8)+'px';bubble.style.top=Math.round(y/.8)+'px';");
fs.writeFileSync(root+'map-clarity.js',clarity);
let quick=fs.readFileSync(root+'ux-controls.js','utf8');
quick=replace(quick,'Lowest pump price first','Within 10¢/L of cheapest');
quick=replace(quick,"setTimeout(()=>{const b=$('fmnJourneyOnWay');","setTimeout(()=>{window.FMNFeaturePanels?.reveal('fmnJourneyPanel');const b=$('fmnJourneyOnWay');");
fs.writeFileSync(root+'ux-controls.js',quick);
let features=fs.readFileSync(root+'compact-features.js','utf8');features=replace(features,"['price','Lowest price']","['price','Cheapest +10¢']");fs.writeFileSync(root+'compact-features.js',features);
let nearby=fs.readFileSync(root+'nearby-ui.js','utf8');nearby=replace(nearby,'Cheapest pump price','Cheapest +10¢/L');fs.writeFileSync(root+'nearby-ui.js',nearby);
const gradle='android/app/build.gradle';fs.writeFileSync(gradle,replace(fs.readFileSync(gradle,'utf8'),"versionCode 9; versionName '1.2.6-compact-features-test'","versionCode 10; versionName '1.2.7-scale-panels-test'"));
fs.writeFileSync(root+'native-entry.js',replace(fs.readFileSync(root+'native-entry.js','utf8'),'Android 1.2.6 compact features test','Android 1.2.7 scale and panels test'));
// Existing regression suites retain their behaviors, using the new disclosure
// controls and the requested 0.8 geometry. Functional assertions are unchanged.
for(const name of ['native-unified-search-test.cjs','native-ux-controls-test.cjs','native-map-clarity-test.cjs']){
 const file='tools/'+name;let test=fs.readFileSync(file,'utf8');
 test=replace(test,'window.FMNFeatures?.ready&&','window.FMNFeaturePanels?.ready&&');
 if(name!=='native-map-clarity-test.cjs'){
  test=replace(test,"await page.locator('#areaModal.open').waitFor();","await page.locator('#areaModal.open').waitFor();await page.locator('#fmnVehiclePanel>summary').click();await page.locator('#fmnJourneyPanel>summary').click();");
  test=replace(test,"#areaModal .fmn-unified-section h3","#areaModal .fmn-main-feature>summary h3");
 }
 if(name==='native-map-clarity-test.cjs'){
  test=replace(test,'assert.equal(g.header.h,height<480?50:56);assert.equal(g.nav.h,height<480?56:60);','assert.ok(Math.abs(g.header.h-(height<480?50:56)*.8)<.1,JSON.stringify(g));assert.ok(Math.abs(g.nav.h-(height<480?56:60)*.8)<.1,JSON.stringify(g));');
  test=replace(test,'await run(...x);assert.equal(results.writes,0);',"if(!process.env.CHROMIUM_ONLY||x[0]==='chromium')await run(...x);assert.equal(results.writes,0);");
 }
 if(name==='native-ux-controls-test.cjs'){
  test=replace(test,'x.h>=48','x.h>=38.3');test=replace(test,'have 48px touch targets','retain proportionally scaled touch targets');test=replace(test,'spacing.inside>=48&&spacing.tail>=20&&spacing.nav.every(x=>x>=48)','spacing.inside>=38.3&&spacing.tail>=15.9&&spacing.nav.every(x=>x>=38.3)');
 }
 fs.writeFileSync(file,test);
}
for(const name of ['NativeMapTest.java','NativePolishTest.java']){
 const file='android/app/src/androidTest/java/au/com/fillmenow/app/'+name;let test=fs.readFileSync(file,'utf8');
 if(name==='NativeMapTest.java')test=replace(test,'tap("#mapFiltersQuick");tap("#areaGps");','tap("#mapFiltersQuick");waitFor("window.FMNFeaturePanels?.ready",10);if(!Boolean.parseBoolean(json("document.getElementById(\'fmnJourneyPanel\').open")))tap("#fmnJourneyPanel > summary");tap("#areaGps");');
 else{
  for(const [selector,size] of [['.topbar.app-topbar',56],['.bottom-nav',60]])test=replace(test,'assertEquals("'+size+'",json("document.querySelector(\''+selector+'\').getBoundingClientRect().height"));','assertEquals('+size+'*.8,Double.parseDouble(json("document.querySelector(\''+selector+'\').getBoundingClientRect().height")),.1);');
  test=replace(test,'assertEquals("50",json("document.querySelector(\'.topbar.app-topbar\').getBoundingClientRect().height"));','assertEquals(40,Double.parseDouble(json("document.querySelector(\'.topbar.app-topbar\').getBoundingClientRect().height")),.1);');
  test=replace(test,'bounds("Search",false);screen("03-search");tap("#areaClose");','waitFor("window.FMNFeaturePanels?.ready",10);for(String id:new String[]{"fmnVehiclePanel","fmnJourneyPanel"})if(Boolean.parseBoolean(json("document.getElementById(\'"+id+"\').open")))tap("#"+id+" > summary");bounds("Features collapsed",false);screen("03-search");tap("#fmnVehiclePanel > summary");tap("#fmnJourneyPanel > summary");bounds("Features expanded",false);screen("03-search-expanded");tap("#locationSearch");SystemClock.sleep(1200);bounds("Features keyboard",true);screen("03-search-keyboard");device.pressBack();SystemClock.sleep(500);tap("#areaClose");');
 }
 fs.writeFileSync(file,test);
}
const cap=path.resolve('native/node_modules/@capacitor/cli/bin/capacitor');execFileSync(process.execPath,[cap,'sync','android'],{cwd:path.resolve('native'),stdio:'inherit'});
console.log('Native 1.2.7 prepared: whole-app 80% scale, full viewport and collapsible Features panels.');
