'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright'),layoutBundle=require('./native-layout-runtime-fixture.cjs');
const root=path.resolve('native/www'),dir=path.resolve(process.env.OUT||'compact-features-qa');
fs.mkdirSync(dir,{recursive:true});
const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
const now=new Date().toISOString();
const stations=Array.from({length:18},(_,i)=>({station_id:'SEARCH-QA-'+i,station_name:i===0?'Ampol Foodary Carseldine test fixture':'Test fuel station '+i,brand:['Ampol','BP','Shell'][i%3],suburb:'Brisbane',state:'QLD',address:'Synthetic QA only',latitude:-27.47+(i%6)*.003,longitude:153.025+(i%3)*.003,price:250+i,fuel_type:'Diesel',price_date:now.slice(0,10),synced_at:now}));
const data={schema_version:1,offers:[],access:[],facilities:stations.slice(0,5).map(r=>({station_id:r.station_id,state:'QLD',kind:'operator_listed_truck_stop',note:'Synthetic test facility; deliberately verbose source text to catch narrow-column regressions. '+('Unverified source note. '.repeat(15)),source_url:'https://example.com/test',checked_at:now,canopy_height_m:4.3,canopy_source_url:'https://example.com/canopy',phone:'0730000000'}))};
const report={cases:[],writes:0};
async function run(engine,w,h){let browser,page,rec={engine,w,h,checks:[],errors:[]};
try{
 browser=await({chromium,webkit}[engine]).launch({headless:true});
 const context=await browser.newContext({viewport:{width:w,height:h},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 await context.addInitScript(()=>{localStorage.setItem('fmnOnboarded','1');localStorage.setItem('fdLoc',JSON.stringify({lat:-27.47,lng:153.025,state:'QLD',label:'Brisbane'}));localStorage.setItem('fdPrefs',JSON.stringify({state:'QLD',fuel:'Diesel',radius:20,tank:250,economy:35,vehicle:'truck',truck:{height:4.2,width:2.5,length:12.5,weight:12,configuration:'rigid'},frequency:'off'}));});
 await context.route('https://localhost/**',async r=>{const n=new URL(r.request().url()).pathname;
 if(n==='/data/station-information.json')return r.fulfill({json:data});
 const rel=n==='/'?'index.html':n.slice(1),file=path.resolve(root,rel);
 if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return r.fulfill({status:404,body:'Missing fixture asset'});
 let b=fs.readFileSync(file);if(rel==='native-entry.js')b=Buffer.from(layoutBundle(b.toString())+';window.FMNNativeLocation.geolocation={watchPosition(ok){setTimeout(()=>ok({timestamp:Date.now(),coords:{latitude:-27.47,longitude:153.025,accuracy:8}}),20);return 1},clearWatch(){}};');
 return r.fulfill({body:b,contentType:mime[path.extname(file)]||'application/octet-stream'});
 });
 await context.route('https://tiles.openfreemap.org/**',r=>r.fulfill({json:{version:8,sources:{qa:{type:'geojson',data:{type:'FeatureCollection',features:[]},attribution:'<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap</a>'}},layers:[{id:'test-background',type:'background',paint:{'background-color':'#ecf2ec'}},{id:'qa-credit',type:'circle',source:'qa'}]}}));
 await context.route('**/functions/v1/fueldrop*',r=>{if(!['GET','OPTIONS'].includes(r.request().method())){report.writes++;return r.abort()}const u=new URL(r.request().url());const api=u.searchParams.get('api');return r.fulfill({json:api==='prices'?{ok:true,rows:stations.map(s=>({...s,fuel_type:u.searchParams.get('fuel')||'Diesel'})),price_date:now.slice(0,10)}:api==='geocode'?{ok:true,candidates:[{label:'Ashgrove QLD',state:'QLD',lat:-27.446,lng:152.988}]}:{ok:true,configured:false,launchStates:['QLD','NSW','WA','TAS'],regions:[]}});});
 page=await context.newPage();page.on('pageerror',e=>rec.errors.push(e.stack));page.setDefaultTimeout(15000);
 await page.goto('https://localhost/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.FMNFeatures?.ready&&Number(document.querySelector('#statCount').textContent)>0);
 assert.equal(await page.locator('.topbar #recenterBtn').count(),1);
 assert.equal(await page.locator('#topArea').isVisible(),false);
 assert.equal(await page.locator('#mapSettingsBtn').count(),0);
 assert.equal(await page.locator('.maplibregl-ctrl-zoom-in:visible,.maplibregl-ctrl-zoom-out:visible,.maplibregl-ctrl-attrib-button:visible').count(),0);
 assert.equal(await page.evaluate(()=>FMNJourneyApp.getMap().touchZoomRotate.isEnabled()),true);
 await page.waitForFunction(()=>document.querySelector('.maplibregl-ctrl-attrib')?.textContent.includes('OpenStreetMap'));
 const locate=await page.locator('#recenterBtn').boundingBox();assert(locate.width>=44&&locate.height>=44&&locate.x+locate.width<=w);
 // Features must open with Best Stop expanded; no hidden button underneath it.
 await page.locator('#mapFiltersQuick').click();await page.locator('#areaModal.open').waitFor();
 assert.equal(await page.locator('#areaTitle').innerText(),'Features');
 assert.equal(await page.locator('#mapFiltersQuick').getAttribute('aria-expanded'),'true');
 const initial=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,scroll:document.querySelector('#areaModal .popup-scroll').scrollWidth-document.querySelector('#areaModal .popup-scroll').clientWidth,fields:[...document.querySelectorAll('#areaModal select,#areaModal input')].filter(e=>e.getClientRects().length&&!e.closest('[hidden],[aria-hidden=true],details:not([open])')).map(e=>({id:e.id,w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height,right:e.getBoundingClientRect().right}))}));
 assert(initial.overflow<=1&&initial.scroll<=1);assert(initial.fields.every(e=>e.w>60&&e.h>=44&&e.right<=w+1),JSON.stringify(initial.fields));
 await page.screenshot({path:path.join(dir,engine+'-'+w+'-features.png')});
 rec.checks.push('One 44px header Locate; Features opens above expanded Best Stop; no gear, zoom buttons or info icon; readable fields without overflow; map credits retained');
 await page.locator('#fmnFeatureRefine summary').click();
 await page.locator('#fmnSearchVehicle').selectOption('car');await page.waitForFunction(()=>document.getElementById('fmnFeatureAccess').closest('label').hidden);assert.equal(await page.locator('#fmnFeatureAccess').isVisible(),false);
 await page.locator('#fmnSearchVehicle').selectOption('truck');await page.waitForFunction(()=>!document.getElementById('fmnFeatureAccess').closest('label').hidden);assert.equal(await page.locator('#fmnFeatureAccess').isVisible(),true);
 await page.locator('#fmnFeatureSort').selectOption('price');await page.locator('#fmnFeatureMinKm').fill('0');await page.locator('#fmnFeatureMaxKm').fill('30');await page.locator('#fmnFeatureApply').click();
 await page.waitForFunction(()=>FMNNearbyUI.getFilters().sort==='price'&&FMNNearbyUI.getFilters().maxKm===30);
 assert.equal(await page.evaluate(()=>FMNNearbyApp.getPrefs().radius),30);
 await page.locator('#fmnFeatureMinKm').fill('40');await page.locator('#fmnFeatureApply').click();
 assert.equal(await page.evaluate(()=>FMNNearbyUI.getFilters().minKm),0);assert.match(await page.locator('#fmnFeatureStatus').innerText(),/less than or equal/);
 await page.locator('#fmnFeatureReset').click();assert.equal(await page.locator('#fmnFeatureSort').inputValue(),'value');
 await page.locator('#fmnFeatureAccess').selectOption('height');await page.locator('#fmnFeatureApply').click();await page.waitForFunction(()=>Number(document.querySelector('#statCount').textContent)===0);
 await page.locator('#fmnFeatureReset').click();await page.waitForFunction(()=>Number(document.querySelector('#statCount').textContent)===5);
 await page.locator('#areaClose').click();assert.equal(await page.locator('#mapFiltersQuick').getAttribute('aria-expanded'),'false');
 rec.checks.push('Compact station filters share app sorting, distance, saved radius and truck restrictions; invalid ranges rejected; Reset restores listed facilities');
 await page.evaluate(()=>FD.open('SEARCH-QA-0'));await page.locator('#stationModal.open').waitFor();
 const box=await page.locator('#stationMetrics .fmn-station-extras').boundingBox(),parent=await page.locator('#stationMetrics').boundingBox();assert(box.width>=parent.width-2,'Access summary spans the full metric grid');
 const text=await page.locator('#stationMetrics').innerText();assert.match(text,/Listed canopy · 4.3 m/);assert.equal((text.match(/Full access unverified/g)||[]).length,1);assert(!text.includes('deliberately verbose'));
 await page.screenshot({path:path.join(dir,engine+'-'+w+'-station.png')});
 await page.locator('#stationMetrics [data-station-access]').click();await page.locator('.fmn-access-dialog[open]').waitFor();
 assert.equal(await page.locator('.fmn-access-dialog .nearby-warning').count(),1);
 assert.match(await page.locator('.fmn-access-canopy').innerText(),/4.3 m/);
 assert.equal(await page.locator('.fmn-access-dialog a[href="tel:0730000000"]').count(),1);
 const detail=await page.locator('.fmn-access-dialog .nearby-scroll').innerText();assert(!detail.includes('Ask before you travel'));assert(detail.split(/\s+/).length<65);
 const layout=await page.locator('.fmn-access-dialog').evaluate(d=>({overflow:d.scrollWidth-d.clientWidth,inner:d.querySelector('.nearby-scroll').scrollWidth-d.querySelector('.nearby-scroll').clientWidth,buttons:[...d.querySelectorAll('.truck-contact-link,footer button')].map(e=>({h:e.getBoundingClientRect().height,left:e.getBoundingClientRect().left,right:e.getBoundingClientRect().right}))}));assert(layout.overflow<=1&&layout.inner<=1&&layout.buttons.every(b=>b.h>=44&&b.left>=0&&b.right<=w));
 await page.screenshot({path:path.join(dir,engine+'-'+w+'-truck-access.png')});await page.locator('.fmn-access-dialog .nearby-back').click();
 assert.equal(await page.locator('#stationModal .popup-footer #stationGo').isVisible(),true);
 await page.locator('#stationGo').click();await page.locator('.fmn-access-dialog[open]').waitFor();assert.equal(await page.locator('.fmn-access-dialog .nearby-warning').count(),1);assert.match(await page.locator('.fmn-access-dialog .nearby-warning').innerText(),/Standard directions do not check truck restrictions/);await page.locator('.fmn-access-dialog .nearby-back').click();await page.locator('#stationClose').click();
 rec.checks.push('Station access spans both columns; one short warning with measured canopy, unbroken dimensions and working operator/call links; lengthy repeated source text removed');
 await page.evaluate(()=>{if(!document.getElementById('mobileSheet').classList.contains('is-collapsed'))FD.sheet();FMNMapClarity.hide();});await page.waitForTimeout(300);
 if(engine==='chromium'){
  const spot=await page.evaluate(()=>{const r=document.getElementById('exploreMap').getBoundingClientRect();for(const fy of [.25,.4,.6])for(const fx of [.35,.55,.7]){const x=r.left+r.width*fx,y=r.top+r.height*fy;if([x-65,x,x+65].every(xx=>document.elementFromPoint(xx,y)?.classList.contains('maplibregl-canvas')))return{x,y};}return null;});assert(spot,'Find an exposed map area for two-finger gesture');
  const cdp=await context.newCDPSession(page),zoom=await page.evaluate(()=>FMNJourneyApp.getMap().getZoom());
  const fingers=d=>[{x:spot.x-d,y:spot.y,id:1},{x:spot.x+d,y:spot.y,id:2}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:fingers(20)});
  for(let d=25;d<=65;d+=5){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:fingers(d)});await page.waitForTimeout(25);}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForFunction(z=>FMNJourneyApp.getMap().getZoom()>z+.2,zoom);await cdp.detach();
  rec.checks.push('Actual two-finger map gesture still zooms without +/− controls');
 }
 await page.screenshot({path:path.join(dir,engine+'-'+w+'-map.png')});
 assert.deepEqual(rec.errors,[]);rec.status='PASS';
}catch(e){rec.status='FAIL';rec.error=String(e.stack);if(page)await page.screenshot({path:path.join(dir,engine+'-'+w+'-failed.png')}).catch(()=>{});throw e;}
finally{report.cases.push(rec);fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(rec));if(browser)await browser.close();}
}
(async()=>{const cases=process.env.QUICK?[['chromium',390,844]]:[['chromium',320,740],['chromium',390,844],['chromium',412,915],['chromium',844,390],['webkit',390,844]];for(const args of(process.env.CHROMIUM_ONLY?cases.filter(c=>c[0]==='chromium'):cases))await run(...args);assert.equal(report.writes,0);report.status='PASS';fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));})().catch(e=>{report.status='FAIL';report.error=String(e.stack);fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2));console.error(e);process.exitCode=1;});
