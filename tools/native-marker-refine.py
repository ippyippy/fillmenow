"""Native asset changes only. Preserve the tested direct-GPS and saved-preference implementations."""
from pathlib import Path
import sys
root=Path(sys.argv[1] if len(sys.argv)>1 else 'native/www')
def change(s,old,new):
    assert s.count(old)==1, f'Expected one reviewed source block: {old[:100]!r} ({s.count(old)})'
    return s.replace(old,new,1)
p=root/'index.html';s=p.read_text()
s=change(s,'map.on("moveend",renderMapMarkers);','map.on("moveend",scheduleMapLabelLayout);')
s=change(s,'map.on("move",scheduleMapLabelLayout);','map.on("zoomend",scheduleMapLabelLayout);')
s=change(s,'map.on("resize",renderMapMarkers);','map.on("resize",scheduleMapLabelLayout);')
s=change(s,'function markerProfile(){if(map){','function markerProfile(){if(map&&!map.isZooming()){')
s=change(s,'width:60,height:66','width:88,height:44')
s=change(s,'else userLocationPin.setLngLat([+loc.lng,+loc.lat]);','else {var here=userLocationPin.getLngLat();if(here.lng!==+loc.lng||here.lat!==+loc.lat)userLocationPin.setLngLat([+loc.lng,+loc.lat]);}')
start=s.index('  var sig=[x.brand,x.station_name,x.price,x.fuel_type].join("|");');end=s.index('  if(+pin.station.longitude',start)
s=s[:start]+'''  var sig=[x.brand,x.station_name].join("|");
  if(sig!==pin.signature){
   var temporary=document.createElement("span");temporary.innerHTML=brandMark(x.brand,x.station_name);
   var brand=el.querySelector('.brand-mark');if(brand)brand.replaceWith(temporary.firstElementChild);else el.prepend(temporary.firstElementChild);
   pin.signature=sig;
  }
  var price=el.querySelector('.pin-price');
  if(!price){price=document.createElement('span');price.className='pin-price';price.appendChild(document.createTextNode(''));var unit=document.createElement('small');unit.textContent='¢';price.appendChild(unit);el.appendChild(price);}
  var value=(+x.price).toFixed(1);if(price.firstChild.nodeValue!==value)price.firstChild.nodeValue=value;
'''+s[end:]
s=change(s,'  pin.marker.setOffset([0,-8]);\n','')
s=change(s,' setTimeout(function(){try{map.resize()}catch(e){}},80)',' if(!mapResizeTimer)mapResizeTimer=setTimeout(function(){mapResizeTimer=null;try{var box=map.getContainer(),key=box.clientWidth+":"+box.clientHeight;if(key!==lastMapSize){lastMapSize=key;map.resize();}}catch(e){}},80)')
s=change(s,'var lastSearchCameraKey="";','var lastSearchCameraKey="",mapResizeTimer=null,lastMapSize="";')
# Keep a recent same-fuel snapshot only DURING a labelled refresh. Errors still remove failed data.
s=change(s,'async function load(){','var priceDatasetKey="",priceLoadedAt=0;\nasync function load(){')
s=change(s,' rows=[];priceStatus=loc?"loading":"idle";render();renderSaved();',' var datasetKey=prefs.state+"|"+prefs.fuel;\n var keep=loc&&rows.length&&priceDatasetKey===datasetKey&&Date.now()-priceLoadedAt<300000;\n if(!keep)rows=[];priceStatus=loc?"loading":"idle";render();renderSaved();')
s=change(s,'  rows=j.rows;priceStatus="ready";render();renderSaved();','  rows=j.rows;priceDatasetKey=datasetKey;priceLoadedAt=Date.now();priceStatus="ready";render();renderSaved();')
s=change(s,' e.textContent=!loc?"Choose area":ranked.length+" station"+(ranked.length===1?"":"s")+(allRanked.length!==ranked.length?" · filtered":"")+" · View all";',' var countText=!loc?"Choose area":(priceStatus==="loading"?"Updating · ":"")+ranked.length+(window.FMNNearbyCore&&FMNNearbyCore.truckMode(prefs)?" truck stops":" station"+(ranked.length===1?"":"s"))+" · View all";\n if(e.textContent!==countText)e.textContent=countText;\n e.dataset.priceStatus=priceStatus;')
# Saved entries are hidden in truck mode, not deleted or rewritten.
s=change(s,'function renderSaved(){\n var add=$("addStationBtn");','''function renderSaved(){
 var add=$("addStationBtn");
 var visibleSaved=saved.filter(function(x){return !window.FMNNearbyCore||!FMNNearbyCore.truckMode(prefs)||!!window.FMNNearbyUI&&FMNNearbyUI.isTruckStation(x);});
 var hiddenCount=saved.length-visibleSaved.length;
 if(hiddenCount&&!visibleSaved.length){
  if(add){add.textContent="Find truck stations";add.style.display="block";}
  $("savedList").innerHTML='<div class="saved-truck-notice" role="status"><b>No saved truck-facility stations in our checked records.</b><p>'+hiddenCount+' saved stations are hidden while Truck mode is on. Your favourites have not been removed. Switch off Truck mode to see all saved stations.</p></div>';return;
 }
''')
s=change(s,'$("savedList").innerHTML=\'<div class="saved-list">\'+saved.map(function(x){','$("savedList").innerHTML=(hiddenCount?\'<p class="saved-truck-notice">\'+hiddenCount+\' saved stations hidden in Truck mode. Switch off Truck mode to see them; none were deleted.</p>\':\'\')+\'<div class="saved-list">\'+visibleSaved.map(function(x){')
s=change(s,"refreshResults:function(){render();if(document.body.dataset.page==='options')renderOptions()}","refreshResults:function(){render();if(document.body.dataset.page==='options')renderOptions();if(document.body.dataset.page==='saved')renderSaved()}")
s=change(s,'</head>','<link rel="stylesheet" href="/station-map-refine.css"></head>');p.write_text(s)
# Mandatory shared eligibility: a truck facility is not inferred from brand, diesel or dimensions.
p=root/'nearby-core.js';s=p.read_text();s=change(s,"}).filter(r=>(f.deals==='all'","}).filter(r=>(!truckMode(ctx)||!!r._facility)&&(f.deals==='all'");p.write_text(s)
p=root/'nearby-ui.js';s=p.read_text()
s=change(s,"if(!app){lastList=rows;return rows;}","if(!app){lastList=C.truckMode(prefs)?[]:rows;return lastList;}")
s=change(s,'Show all, including unverified access','All recorded truck facilities · clearance unconfirmed')
s=change(s,"'Show all · clearance unknown'","C.truckMode(context())?'Reset truck filters':'Show all stations'")
s=change(s,"if(wider)wider.hidden=true;","if(wider)wider.hidden=!C.truckMode(context());")
s=change(s,"all:'All access · truck fit not confirmed'","all:'Truck facilities only · clearance unconfirmed'")
s=change(s,"truckstops:'Operator-listed truck facilities'","truckstops:'Truck facilities only · clearance unconfirmed'")
s=change(s,"if(C.truckMode(context())&&f.access==='truckstops')","if(C.truckMode(context())&&['truckstops','all','unknown'].includes(f.access))")
s=change(s,"No operator-listed truck facilities are in this filtered search yet. Our checked list is incomplete; unknown does not mean absent.","No recorded truck facilities match this search. Our operator-checked coverage is incomplete. Increase the radius or change area; ordinary or unrecorded stations will not be substituted.")
s=change(s,"function emptyMessage(){const f=useFilters();","function emptyMessage(){const f=useFilters();if(C.truckMode(context())&&catalogState!=='ready')return catalogueText();")
s=change(s,"return n+' of '+total+' stations · '","return n+' of '+total+(C.truckMode(context())?' stations · Truck facilities only · ':' stations · ')")
s=change(s,"window.FMNNearbyUI={getFilters:","window.FMNNearbyUI={isTruckStation:row=>!!app&&!!C.facilityFor(row,{...context(),state:row.state||context().state},catalog),getFilters:");p.write_text(s)
p=root/'marker-badges.js';s=p.read_text()
s=change(s," const d=describe(row,context),signature=JSON.stringify(d);"," const d=describe(row,context),signature=JSON.stringify(d);\n if(node.dataset.badgeSignature===signature&&node.querySelector('.pin-secondary-tags')&&node.querySelector('.pin-value-label'))return d;");p.write_text(s)
print('Native refinement applied: horizontal badges, stable station/logo reconciliation and mandatory truck-facility results.')
