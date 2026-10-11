/* Search owns location, journey and the existing vehicle controls in one scrolling sheet. */
(function(){
'use strict';
let vehicle,home,next,inserted=false;
const $=id=>document.getElementById(id);
function refresh(){
 const modal=$('areaModal'),scroll=modal?.querySelector('.popup-scroll'),panel=$('drawer-vehicle');
 if(!modal||!scroll||!panel)return;
 const open=modal.classList.contains('open');
 if(open){
  if(!inserted){
   vehicle=panel;home=panel.parentNode;next=panel.nextSibling;
   const holder=document.createElement('section');holder.id='unifiedVehicle';holder.setAttribute('aria-label','Your vehicle and fuel');
   const h=document.createElement('h3');h.textContent='Your vehicle & fuel';holder.appendChild(h);
   const p=document.createElement('p');p.textContent='Use your saved vehicle when comparing fuel stops. Changes here also update Vehicle Settings.';holder.appendChild(p);
   const wrap=document.createElement('div');wrap.className='unified-vehicle-fields';holder.append(wrap);
   const journey=scroll.querySelector('.journey-fields');
   if(journey)journey.after(holder);else scroll.append(holder);
   wrap.append(panel);panel.style.display='block';
   const radius=document.createElement('label');radius.className='field unified-radius';radius.textContent='Search radius';
   const select=document.createElement('select');select.id='unifiedRadius';select.setAttribute('aria-label','Search radius');
   for(const km of [5,10,20,30,50,100]){const option=document.createElement('option');option.value=String(km);option.textContent=km+' km';select.append(option);}
   select.addEventListener('change',()=>{const target=$('mobileRadiusSelect');if(target){target.value=select.value;target.dispatchEvent(new Event('change',{bubbles:true}));}});
   radius.append(select);holder.append(radius);
   const action=$('saveVehicle');if(action)action.textContent='Save vehicle & continue';
   inserted=true;
  }
  const selected=$('mobileRadiusSelect')?.value;if(selected&&$('unifiedRadius'))$('unifiedRadius').value=selected;
 }else if(inserted){
   if(vehicle&&home){if(next&&next.parentNode===home)home.insertBefore(vehicle,next);else home.appendChild(vehicle);vehicle.style.display='';}
   $('unifiedVehicle')?.remove();inserted=false;
 }
}
function init(){
 const modal=$('areaModal');if(!modal)return;
 new MutationObserver(refresh).observe(modal,{attributes:true,attributeFilter:['class']});
 $('topArea')?.setAttribute('aria-label','Search location, journey and vehicle');
 refresh();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();