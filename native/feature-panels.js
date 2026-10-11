/* Use native details controls and move the existing form nodes, preserving all
   input handlers, drafts and app preferences when a panel is collapsed. */
(function(){'use strict';
const $=id=>document.getElementById(id),key='fmnFeaturePanels';
let panels={},saved={};
try{saved=JSON.parse(localStorage.getItem(key)||'{}')||{};}catch{}
function reveal(id){const p=panels[id];if(p)p.open=true;}
function brief(){
 const vehicle=$('fmnVehiclePanelBrief'),journey=$('fmnJourneyPanelBrief');if(!vehicle||!journey)return;
 const p=window.FMNNearbyApp.getPrefs(),destination=window.FMNJourney?.getDestination();
 vehicle.textContent=[$('fmnSearchVehicle').selectedOptions[0]?.textContent,p.fuel,p.radius+' km'].filter(Boolean).join(' · ');
 const place=window.FMNJourneyApp?.getLocation()?.label||$('stateSelect').selectedOptions[0]?.textContent;
 journey.textContent=destination?'On my way · '+destination.label:'Nearby'+(place?' · '+place:'');
}
function wrap(id,panelId){
 const section=$(id),panel=document.createElement('details'),summary=document.createElement('summary'),label=document.createElement('span'),info=document.createElement('span');
 panel.id=panelId;panel.className='fmn-feature-details fmn-main-feature';label.className='fmn-panel-label';info.id=panelId+'Brief';info.className='fmn-panel-brief';
 const heading=section.querySelector('h3');summary.setAttribute('aria-label',heading.textContent.trim());summary.setAttribute('aria-describedby',info.id);label.append(heading,info);summary.append(label);section.before(panel);panel.append(summary,section);return panel;
}
function mount(){
 if(!window.FMNFeatures?.ready)return false;
 panels.fmnVehiclePanel=wrap('fmnUnifiedVehicle','fmnVehiclePanel');panels.fmnJourneyPanel=wrap('fmnUnifiedJourney','fmnJourneyPanel');
 const popular=$('fmnPopularAreas');panels.fmnJourneyPanel.after(popular);
 for(const id of ['fmnPopularAreas','fmnFeatureRefine','fmnSearchDetails'])if($(id))panels[id]=$(id);
 for(const [id,panel] of Object.entries(panels)){
  const summary=panel.querySelector(':scope > summary');if(summary&&!summary.hasAttribute('aria-label'))summary.setAttribute('aria-label',summary.textContent.trim());
  panel.open=saved[id]===true;
  panel.addEventListener('toggle',()=>{saved[id]=panel.open;try{localStorage.setItem(key,JSON.stringify(saved));}catch{}brief();});
 }
 if(!window.FMNJourneyApp?.getLocation())reveal('fmnJourneyPanel');
 const area=$('areaModal');area.addEventListener('change',()=>queueMicrotask(brief));
 // Scroll only the form region after Android has resized for the keyboard.
 function keepFieldVisible(){
  const field=document.activeElement,scroll=area.querySelector('.popup-scroll');
  if(!area.classList.contains('open')||!scroll?.contains(field)||!field.matches('input,textarea,select'))return;
  const r=field.getBoundingClientRect(),b=scroll.getBoundingClientRect(),footer=area.querySelector('.popup-footer').getBoundingClientRect();
  const bottom=Math.min(b.bottom,footer.top,innerHeight)-8,top=b.top+8;
  if(r.bottom>bottom)scroll.scrollTop+=r.bottom-bottom;else if(r.top<top)scroll.scrollTop-=top-r.top;
 }
 let focusTimer;
 function revealField(){clearTimeout(focusTimer);focusTimer=setTimeout(()=>requestAnimationFrame(keepFieldVisible),160);}
 area.addEventListener('focusin',revealField);window.addEventListener('resize',revealField);window.visualViewport?.addEventListener('resize',revealField);

 const observer=new MutationObserver(brief);observer.observe(area,{attributes:true,attributeFilter:['class']});
 document.addEventListener('fmn:scope-change',brief);
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 brief();window.FMNFeaturePanels.ready=true;return true;
}
window.FMNFeaturePanels={reveal,ready:false};
function start(){if(mount())return;let tries=0;const timer=setInterval(()=>{if(mount()||++tries>75)clearInterval(timer);},160);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
