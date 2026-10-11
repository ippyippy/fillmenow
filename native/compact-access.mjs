// Functions are inserted into the existing Nearby closure by the native build.
export function badges(row,prefs){
 const box=el('div',undefined,'fmn-station-extras');
 if(!C.priceReview(row)&&app.getCheapestId?.()===String(row.station_id))box.append(el('span',app.getBestId?.()===String(row.station_id)?'Cheapest too':'Cheapest','station-trait cheapest'));
 if(C.priceReview(row))box.append(el('div','Price needs checking · excluded from recommendations','nearby-warning'));
 if(C.truckMode(prefs)){
  const a=C.truckAccess(row,prefs,catalog),facility=C.facilityFor(row,prefs,catalog),wrap=el('div',undefined,'fmn-station-access');
  if(facility?.canopy_height_m)wrap.append(el('span','Listed canopy · '+facility.canopy_height_m+' m','fmn-canopy-chip'));
  wrap.append(el('span',a.status==='match'?'Matches recorded dimensions':a.status==='mismatch'?'Does not match recorded limits':'Full access unverified','fmn-access-note'));
  const button=el('button','Truck access details','truck-check-button');button.type='button';button.dataset.stationAccess=String(row.station_id);wrap.append(button);box.append(wrap);
 }
 return box.children.length?box.outerHTML:'';
}
export function showAccessCheck(row){
 if(!row||!C.truckMode(context()))return;
 const d=modal('Truck access'),body=d.querySelector('.nearby-scroll'),ctx=context(),t=ctx.truck||{},facility=C.facilityFor(row,ctx,catalog),status=C.truckAccess(row,ctx,catalog);
 d.classList.add('fmn-access-dialog');body.append(el('h3',row.station_name));
 const profile=el('div',undefined,'fmn-access-profile');
 for(const [key,unit] of [['height','m high'],['width','m wide'],['length','m long'],['weight','t']])profile.append(el('span',(t[key]||'—')+' '+unit));
 body.append(profile);
 const canopy=el('div',undefined,'fmn-access-canopy');canopy.append(el('span','Listed canopy'),el('strong',facility?.canopy_height_m?facility.canopy_height_m+' m':'Not recorded'));body.append(canopy);
 body.append(el('div',status.status==='mismatch'?'Does not match recorded truck limits.':status.status==='match'?'Recorded dimensions match. Check road access.':'Full access unverified. Confirm entrance and turning space.','nearby-warning'));
 if(facility){
  const contacts=el('div',undefined,'fmn-access-contacts'),source=el('a','Operator details','truck-contact-link');source.href=facility.source_url;source.target='_blank';source.rel='noopener noreferrer';contacts.append(source);
  const phone=String(facility.phone||'').replace(/[ ()-]/g,'');if(/^\+?[0-9]{8,15}$/.test(phone)){const call=el('a','Call station','truck-contact-link');call.href='tel:'+phone;contacts.append(call);}body.append(contacts);
  const sourceLine=el('p','Listing checked '+new Date(facility.checked_at).toLocaleDateString('en-AU'),'truck-source-date');
  if(facility.canopy_height_m&&/^https:\/\//.test(facility.canopy_source_url||'')){const atlas=el('a','Canopy source');atlas.href=facility.canopy_source_url;atlas.target='_blank';atlas.rel='noopener noreferrer';sourceLine.append(document.createTextNode(' · '),atlas);}body.append(sourceLine);
 }else body.append(el('p','Operator contact unavailable.','truck-source-date'));
}
export function navigate(row,proceed){
 if(!C.truckMode(context())){proceed();return;}
 const d=modal('Directions'),body=d.querySelector('.nearby-scroll'),status=C.truckAccess(row,context(),catalog);
 d.classList.add('fmn-access-dialog');body.append(el('h3',row.station_name));
 body.append(el('div',status.status==='mismatch'?'Truck exceeds recorded limits. Standard directions do not check truck restrictions.':'Standard directions do not check truck restrictions. Confirm access first.','nearby-warning'));
 const button=el('button','Open directions');button.type='button';button.onclick=()=>{d.close();proceed();};d.querySelector('footer').appendChild(button);
}
