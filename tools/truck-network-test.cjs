'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const C=require('../web/nearby-core.js');
const catalog=JSON.parse(fs.readFileSync('web/data/station-information.json'));
const evidence=JSON.parse(fs.readFileSync('docs/data/truck-network-matches-20261011.json'));
// Freeze at the actual review date; separately verify that stale records stop qualifying.
const now=Date.parse('2026-10-11T08:00:00Z');
const ctx={state:'QLD',vehicle:'truck',radius:100,tank:300,truck:{height:4.2,width:2.5,length:12,weight:18,configuration:'rigid'}};
const row={station_id:'61401523',distance:2,price:220,effective:224,fuel_type:'Diesel'};
const keys=catalog.facilities.map(r=>r.state+':'+r.station_id);
assert.equal(new Set(keys).size,keys.length,'One facility per provider station');
assert.equal(keys.length,151);
assert.deepEqual(catalog.access,[],'A network listing is never a verified full-site clearance');
assert.deepEqual(catalog.offers,[],'No discounts invented');
for(const m of evidence.matches){
 const f=catalog.facilities.find(r=>r.state===m.state&&r.station_id===m.station_id);
 assert(f&&f.operator_site_id===m.operator_site_id&&f.source_url===m.source_url);
 assert.match(f.source_url,/^https:\/\/locations\.ampol\.com\.au\/en\//);
 const rad=x=>x*Math.PI/180,la=rad(m.operator_latitude),lb=rad(m.provider_latitude),dl=rad(m.provider_longitude-m.operator_longitude);
 const distance=6371000*2*Math.asin(Math.sqrt(Math.sin((lb-la)/2)**2+Math.cos(la)*Math.cos(lb)*Math.sin(dl/2)**2));
 assert(distance<=200,m.provider_name+' coordinate check');
 assert(C.facilityFor({station_id:m.station_id},{...ctx,state:m.state},catalog,now));
 assert.equal(C.facilityFor({station_id:m.station_id},{...ctx,state:m.state},catalog,now+91*86400000),null);
}
assert.equal(C.facilityFor(row,{...ctx,state:'NSW'},catalog,now),null,'Never match across states');
assert.equal(C.facilityFor({...row,station_id:'not-listed'},ctx,catalog,now),null);
assert.equal(C.canopyAccess(row,ctx,catalog,now),'unverified','4.2m plus existing 0.1m allowance fits a 4.3m figure without certifying access');
assert.equal(C.truckAccess(row,ctx,catalog,now).status,'unknown');
assert.equal(C.heightAccess(row,ctx,catalog,now),'unknown','A canopy alone does not prove approach clearance');
assert.equal(C.select([row],ctx,{access:'truckstops'},catalog,[],now).length,1);
assert.equal(C.select([row],{...ctx,truck:{...ctx.truck,height:4.21}},{access:'truckstops'},catalog,[],now).length,0);
assert.equal(C.select([row],{...ctx,vehicle:'car',truck:{height:5}},{},catalog,[],now).length,1,'Truck restriction must not hide car results');
const low={...row,station_id:'61402750'}; // Caloundra: published 4.2m canopy.
assert.equal(C.select([low],ctx,{access:'truckstops'},catalog,[],now).length,0);
assert.equal(C.select([low],ctx,{access:'matches'},catalog,[],now).length,0);
const unknown={...row,station_id:'61402344'}; // Hemmant: no numerical canopy height.
assert.equal(C.canopyAccess(unknown,ctx,catalog,now),'unknown');
assert.equal(C.select([unknown],ctx,{access:'truckstops'},catalog,[],now).length,1);
assert.equal(C.select([unknown],ctx,{access:'height'},catalog,[],now).length,0);
assert.equal(C.select([unknown],ctx,{access:'matches'},catalog,[],now).length,0);
const wyong=catalog.facilities.filter(r=>r.name.includes('Wyong'));
assert.deepEqual(wyong.map(r=>r.station_id).sort(),['NSW-903','NSW-906'],'Select the diesel forecourts and preserve travel direction');
assert(!catalog.facilities.some(r=>r.operator_site_id==='55016'),'Do not inherit a car canopy at Rous Head');
console.log('PASS: 151 unique facilities, 147 reviewed operator matches, state/expiry boundaries, canopy rejection, no fabricated clearance or offers, diesel-forecourt identity.');
