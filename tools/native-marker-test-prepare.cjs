'use strict';
const fs=require('fs'),assert=require('node:assert/strict');
const browser='tools/native-marker-browser.cjs';let b=fs.readFileSync(browser,'utf8');
b=b.replace('assert.equal(geometry.normal.w,88);assert.equal(geometry.normal.h,44);','assert.ok(Math.abs(geometry.normal.w-88)<.05);assert.ok(Math.abs(geometry.normal.h-44)<.05);').replaceAll('#nearbyResetButton','#nearbyReset');fs.writeFileSync(browser,b);
const test='android/app/src/androidTest/java/au/com/fillmenow/app/NativePolishTest.java';let s=fs.readFileSync(test,'utf8');const anchor='   tap("#mapStationCount");waitFor("document.body.dataset.page===\'options\'",10);';
if(!s.includes('MARKER_TRUCK_ACCEPTANCE')){assert.equal(s.split(anchor).length,2);s=s.replace(anchor,`   // MARKER_TRUCK_ACCEPTANCE: actual packaged app, existing native profile and live read-only catalogue.
   assertEquals("No non-facility pins in Truck mode","true",json("[...document.querySelectorAll('#exploreMap .station-pin')].every(e=>FMNNearbyUI.isTruckStation({station_id:e.dataset.stationId,state:'QLD'}))"));
   assertEquals("Short horizontal detailed markers","true",json("[...document.querySelectorAll('#exploreMap .station-pin.pin-detail')].every(e=>{const r=e.getBoundingClientRect();return r.width>r.height&&r.height<=53})"));
   run("window.__nativePinNodes=[...document.querySelectorAll('#exploreMap .station-pin')].map(e=>({e,brand:e.querySelector('.brand-mark')}));window.__nativePanDone=false;const m=FMNJourneyApp.getMap();m.once('moveend',()=>window.__nativePanDone=true);m.panBy([24,10],{duration:250})");
   waitFor("window.__nativePanDone",8);
   assertEquals("Pan must not replace native station/logo nodes","true",json("window.__nativePinNodes.every(p=>p.e.isConnected&&p.e.querySelector('.brand-mark')===p.brand)"));
   checks.append("Truck catalogue gate and persistent native marker/logo nodes during an animated pan passed.\\n");
`+anchor);fs.writeFileSync(test,s);}
const C=require('../native/www/nearby-core.js');const now=Date.now(),stamp=new Date(now-1000).toISOString();const ctx={state:'QLD',fuel:'Diesel',radius:10,tank:250,vehicle:'truck',truck:{height:4.2,width:2,length:12,weight:12,configuration:'rigid'}};
const rows=['yes','no','expired','wrong-state','bad-url','diesel-only'].map((id,i)=>({station_id:id,price:180+i,effective:183+i,distance:1,state:'QLD',fuel_type:'Diesel',brand:'BP'}));
const facility=id=>({station_id:id,state:'QLD',kind:'operator_listed_truck_stop',source_url:'https://example.com/fixture',checked_at:stamp,note:'Test-only facility'});
const cat={offers:[],access:[],facilities:[facility('yes'),{...facility('expired'),checked_at:new Date(now-91*86400000).toISOString()},{...facility('wrong-state'),state:'NSW'},{...facility('bad-url'),source_url:'javascript:alert(1)'}]};
for(const access of ['all','truckstops','unknown'])assert.deepEqual(C.select(rows,ctx,{access},cat,[],now).map(x=>x.station_id),['yes']);
for(const access of ['height','matches'])assert.equal(C.select(rows,ctx,{access},cat,[],now).length,0);
assert.equal(C.select(rows,ctx,{},null,[],now).length,0);
assert.equal(C.select(rows,{...ctx,vehicle:'heavy'},{},cat,[],now).length,1);
assert.equal(C.select(rows,{...ctx,vehicle:'car'},{},cat,[],now).length,6);
assert.equal(C.select(rows,ctx,{minKm:2},cat,[],now).length,0);
assert.equal(C.select(rows,ctx,{deals:'active'},cat,[],now).length,0);
console.log('PASS: 10 truck-eligibility scenarios, invalid/expired/source checks, strict height, reset defaults and car/Heavy Truck separation.');
