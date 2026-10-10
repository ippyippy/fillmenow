/* Native-only disclosure styling; preserves the complete existing access warning and filter handlers. */
(function(){'use strict';
function update(){
 const note=document.getElementById('truckAccessNotice');if(!note)return;
 let box=document.getElementById('nativeTruckDetails');
 if(!box){box=document.createElement('details');box.id='nativeTruckDetails';const title=document.createElement('summary');box.append(title);note.before(box);box.append(note);}
 box.hidden=note.hidden;
 const height=note.textContent.match(/Your truck:\s*([\d.]+) m high/),unknown=note.textContent.includes('No verified numerical clearance');
 const title=box.querySelector('summary'),text=(height?height[1]+' m truck':'Truck profile')+' · '+(unknown?'access not confirmed':'review access limits');
 if(title.textContent!==text)title.textContent=text;
 const a=document.getElementById('filterTruckFacilities'),b=document.getElementById('filterTruckHeight');
 if(a&&a.textContent!=='Truck facilities'){a.textContent='Truck facilities';a.setAttribute('aria-label','Show operator-listed truck facilities');}
 if(b&&b.textContent!=='Recorded height'){b.textContent='Recorded height';b.setAttribute('aria-label','Filter by recorded height');}
}
function start(){update();const list=document.querySelector('#page-options .phone-page-body');if(!list)return;const obs=new MutationObserver(update);obs.observe(list,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['hidden']});window.addEventListener('pagehide',()=>obs.disconnect(),{once:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
