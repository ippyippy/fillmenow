// Scoped build of the existing native app. No backend or public website deployment.
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
execFileSync(process.execPath,['tools/native-visual-prepare.mjs'],{stdio:'inherit'});
const root='native/www/';
function patch(file,old,next){const p=root+file,s=fs.readFileSync(p,'utf8');assert.equal(s.split(old).length-1,1,'Review source before patch: '+file+' '+old.slice(0,65));fs.writeFileSync(p,s.replace(old,next));}
function section(file,start,end,next){const p=root+file,s=fs.readFileSync(p,'utf8'),a=s.indexOf(start),b=s.indexOf(end,a);assert(a>=0&&b>a,'Missing section '+start);fs.writeFileSync(p,s.slice(0,a)+next+s.slice(b));}
// All truck search views pass through the existing pure selector. Unknown/non-truck stations never leak back through Reset.
patch('nearby-core.js',"}).filter(r=>(f.deals==='all'", "}).filter(r=>(!truckMode(ctx)||(!!r._facility&&r._access.status!=='mismatch'&&r._height!=='mismatch'))&&(f.deals==='all'");
patch('nearby-ui.js',"function useFilters(){filters=C.normaliseFilters(filters,context().radius);return filters}","function useFilters(){filters=C.normaliseFilters(filters,context().radius);if(C.truckMode(context())&&['all','unknown'].includes(filters.access))filters.access='truckstops';return filters}");
// Do not briefly show ordinary stations while modules/catalogue initialise.
patch('nearby-ui.js','if(!app){lastList=rows;return rows;}','if(!app){lastList=C.truckMode(prefs)?[]:rows;return lastList;}');
patch('index.html','ranked=window.FMNNearbyUI?FMNNearbyUI.select(allRanked,prefs):allRanked;','ranked=window.FMNNearbyUI?FMNNearbyUI.select(allRanked,prefs):(["truck","heavy"].includes(prefs.vehicle)?[]:allRanked);');
patch('index.html','var list=window.FMNNearbyUI?FMNNearbyUI.select(source,prefs):source;','var list=window.FMNNearbyUI?FMNNearbyUI.select(source,prefs):(["truck","heavy"].includes(prefs.vehicle)?[]:source);');
patch('nearby-ui.js','<option value="all">Show all, including unverified access</option><option value="truckstops">Operator-listed truck stops · clearance unknown</option>','<option value="truckstops">Truck facilities only</option>');
patch('nearby-ui.js','<option value="unknown">Clearance not recorded</option>','');
patch('nearby-ui.js',"el('button','Show all · clearance unknown','btn btn-go')","el('button',C.truckMode(context())?'Reset truck filters':'Reset filters','btn btn-go')");
patch('nearby-ui.js',"No operator-listed truck facilities are in this filtered search yet. Our checked list is incomplete; unknown does not mean absent.","No recorded truck facilities match this area and these filters. Expand the radius or change the destination filter. Our facility directory is incomplete; other stations are not substituted.");
patch('nearby-ui.js',"This does not mean there are no truck stops. Check operator-listed facilities or show unknown clearance.","No measured match is recorded. Select Truck facilities to browse recorded truck stops without claiming a height match.");
patch('nearby-ui.js',"Reset filters to include stations with unknown access.","Select Truck facilities to browse recorded truck stops without claiming a dimensional match.");
patch('nearby-ui.js',"if(C.truckMode(context())){main.appendChild(el('span',x._access.label,'nearby-badge '+x._access.status));const check=el('button','Check truck access','truck-check-button');check.type='button';check.onclick=()=>showAccessCheck(x);main.append(check);if(x._facility){const n=el('span',x._facility.note+' ','nearby-facility');const a=el('a','Operator details');a.href=x._facility.source_url;a.target='_blank';a.rel='noopener noreferrer';n.append(a);main.append(n);}}", "if(C.truckMode(context())){const label=x._access.status==='match'?'Matches recorded dimensions':x._height==='height-match'?'Recorded height matches':'Clearance unmeasured';main.appendChild(el('span',label,'nearby-badge '+x._access.status));const check=el('button','Access details','truck-check-button');check.type='button';check.onclick=()=>showAccessCheck(x);main.append(check);}");
patch('marker-badges.js',"'Truck facilities · clearance unconfirmed'","'Truck facilities'");
patch('nearby-ui.js',"No verified numerical clearance measurements are published here yet. Operator-listed truck facilities are separate from a confirmed fit.","Only recorded truck facilities are shown. Numerical limits are not available for these sites yet; open a station’s Access details for its operator source and available measurements.");
patch('visual-polish-details.js',"const title=box.querySelector('summary'),text=(height?height[1]+' m truck':'Truck profile')+' · '+(unknown?'access not confirmed':'review access limits');","const title=box.querySelector('summary'),text='Truck facilities only'+(height?' · '+height[1]+' m profile':'');");
// Scope text no longer becomes a persistent rectangle over View all. Keep a complete accessible summary on Filters.
section('nearby-ui.js','function positionScope(){','function truckActions(){',`function positionScope(){window.FMNMapClarity?.position();}
function updateScope(){if(!app)return;const f=useFilters(),dest=window.FMNJourney?.getDestination(),truck=C.truckMode(context()),fullText=activeText();
 const destination=f.travel==='towards'&&dest&&!dest.manual?String(dest.label).split(' · ')[0].replace(/\\s+(QLD|NSW|WA|TAS|SA|VIC|NT|ACT)$/,''):'';
 const detail={key:JSON.stringify([f,truck,context().truck?.height||null,destination]),active:!!fullText,fullText:fullText,count:lastList.length,destination,truck,deals:f.deals!=='all'};
 window.FMNMapScope=detail;document.dispatchEvent(new CustomEvent('fmn:scope-change',{detail}));
}
`);
// Markers already have stable IDs. Do not throw them away at every same-fuel refresh.
patch('index.html','async function load(){','var priceSnapshotKey="",priceSnapshotAt=0;\nasync function load(){');
patch('index.html','rows=[];priceStatus=loc?"loading":"idle";render();renderSaved();',`var snapshotKey=[prefs.state,prefs.fuel].join('|');
 var retaining=!!loc&&rows.length>0&&priceSnapshotKey===snapshotKey&&Date.now()-priceSnapshotAt<120000;
 if(!retaining)rows=[];
 priceStatus=loc?"loading":"idle";render();renderSaved();
 var note=$("priceRefreshNotice");if(!note){note=document.createElement('div');note.id='priceRefreshNotice';note.role='status';document.querySelector('#page-explore .map-shell').append(note);}note.hidden=!retaining;note.textContent='Updating prices…';`);
patch('index.html','rows=j.rows;priceStatus="ready";render();renderSaved();','rows=j.rows;priceSnapshotKey=snapshotKey;priceSnapshotAt=Date.now();priceStatus="ready";render();renderSaved();');
patch('index.html','if(request===priceRequest&&document.body.dataset.page==="options")renderOptions();','if(request===priceRequest){if($("priceRefreshNotice"))$("priceRefreshNotice").hidden=true;if(document.body.dataset.page==="options")renderOptions();}');
// On pan, MapLibre moves existing elements. No badge re-render or image recreation is needed.
patch('index.html','map.on("moveend",renderMapMarkers);','map.on("moveend",scheduleMapLabelLayout);');
patch('index.html','map.on("move",scheduleMapLabelLayout);','map.on("zoomend",scheduleMapLabelLayout);');
patch('index.html','map.on("resize",renderMapMarkers);','map.on("resize",scheduleMapLabelLayout);');
patch('index.html','function markerProfile(){if(map){','function markerProfile(){if(map&&!map.isMoving()){');
patch('index.html','var sig=[x.brand,x.station_name,x.price,x.fuel_type].join("|");','var sig=[x.brand,x.station_name,x.fuel_type].join("|");');
patch('index.html','if(+pin.station.longitude!==+x.longitude||+pin.station.latitude!==+x.latitude)pin.marker.setLngLat',`if(pin.price!==+x.price){var price=el.querySelector('.pin-price');if(price)price.innerHTML=(+x.price).toFixed(1)+'<small>¢</small>';pin.price=+x.price;}
  if(+pin.station.longitude!==+x.longitude||+pin.station.latitude!==+x.latitude)pin.marker.setLngLat`);
patch('index.html','  pin.marker.setOffset([0,-8]);','  // The offset is constant; changing it each refresh unnecessarily repositions every marker.');
patch('index.html','(allRanked.length!==ranked.length?" · filtered":"")+" · View all"','" · View"');
// Last stylesheet wins consistently, including descendant badge contrast overridden by older broad selectors.
for(const name of ['map-clarity.css','map-clarity.js'])fs.copyFileSync('native/'+name,root+name);
patch('map-clarity.js',"$('exploreMap').addEventListener('pointerdown',e=>{if(e.target.closest('.maplibregl-canvas'))hide();},{passive:true});","$('exploreMap').addEventListener('pointerdown',hide,{passive:true});document.addEventListener('click',e=>{if(e.target.closest('#topArea,#mapSettingsBtn'))hide();});");
patch('index.html','</head>','<link rel="stylesheet" href="/map-clarity.css"></head>');
patch('index.html','</body>','<script src="/map-clarity.js"></script></body>');
// Keep one native storage origin and the same native location code. Only the display version changes.
const gradle='android/app/build.gradle';let g=fs.readFileSync(gradle,'utf8');assert(g.includes("versionCode 4; versionName '1.2.1-visual-test'"));g=g.replace("versionCode 4; versionName '1.2.1-visual-test'","versionCode 5; versionName '1.2.2-map-clarity-test'");fs.writeFileSync(gradle,g);
let entry=fs.readFileSync(root+'native-entry.js','utf8');entry=entry.replaceAll('Android 1.2.1 visual test','Android 1.2.2 map clarity test');fs.writeFileSync(root+'native-entry.js',entry);
execFileSync(process.execPath,[path.resolve('native/node_modules/@capacitor/cli/bin/capacitor'),'sync','android'],{cwd:'native',stdio:'inherit'});
console.log('Prepared native 1.2.2: stable marker refresh, Dash bubble, truck-facility-only results, no GPS provider changes.');
