'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const sandbox={module:{exports:{}},URL,Date};vm.runInNewContext(fs.readFileSync('native/www/nearby-core.js','utf8'),sandbox);
const cores=[['shared',require('../web/nearby-core.js')],['Android',sandbox.module.exports]];
const now=Date.now(),ctx={state:'QLD',fuel:'Diesel',vehicle:'car',radius:20,tank:100};
const row=(id,price,distance=1,extra={})=>({station_id:id,price,distance,effective:price+20,fuel_type:'Diesel',...extra});
const rows=[row('a',201.1),row('tie',201.1),row('near',207.4),row('edge',211.1),row('outside',211.2),row('far',199,21),row('bad',99),row('flagged',150,1,{recommendation_eligible:false})];
let checks=0;
for(const [name,C] of cores){
 const select=(list,filters={},prefs=ctx,cat={})=>[...C.select(list,prefs,{sort:'price',maxKm:20,...filters},cat,[],now)];
 assert.deepEqual(select(rows).map(r=>r.station_id),['a','tie','near','edge']);checks++;
 assert.deepEqual(select(rows,{maxKm:30}).map(r=>r.station_id),['far','a','tie','near']);checks++;
 assert.deepEqual(select([row('low',190,.5),row('local',230,3),row('edge',240,4),row('out',240.1,5)],{minKm:2}).map(r=>r.station_id),['local','edge']);checks++;
 assert.equal(select(rows,{sort:'value'}).length,7);checks++;
 assert.deepEqual(select([row('bad',null),row('nan',NaN),row('flagged',200,1,{recommendation_eligible:false})]),[]);checks++;
 assert.deepEqual(select([]),[]);checks++;
 assert.equal(rows[0]._review,undefined);assert.equal(rows[0].price,201.1);checks++;
 const truck={...ctx,vehicle:'truck',truck:{height:4.2,width:2.5,length:12,weight:12,configuration:'rigid'}},truckRows=[row('ordinary',150),row('listed',250),row('edge',260),row('out',260.1)];
 const cat={offers:[],access:[],facilities:['listed','edge','out'].map(station_id=>({station_id,state:'QLD',kind:'operator_listed_truck_stop',source_url:'https://example.com/fixture',note:'Synthetic test only',checked_at:new Date(now-1000).toISOString()}))};
 assert.deepEqual(select(truckRows,{access:'truckstops'},truck,cat).map(r=>r.station_id),['listed','edge']);checks++;
 console.log(name+': inclusive 10-cent window, tied minima, distance-first reference, invalid-price exclusion, empty results and truck filters passed.');
}
console.log('PASS: '+checks+' cheapest-band checks. Raw prices and other ranking modes retained.');
