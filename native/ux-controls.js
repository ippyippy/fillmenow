/* Native-only quick controls; the existing GPS, destination, ranking, truck safeguards and persistence remain authoritative. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const elt=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let journeyReady=false,quickReady=false,radio=[],chips={};
const current=()=>window.FMNNearbyUI?.getFilters?.()||{};
const syncJourney=()=>{
 if(!journeyReady)return;
 const value=$('journeyMode')?.value||'nearby';
 for(const b of radio){const yes=b.dataset.journey===value;b.setAttribute('aria-pressed',String(yes));b.classList.toggle('active',yes);}
 const status=$('fmnJourneyStatus'),d=window.FMNJourney?.getDestination?.();
 if(status)status.textContent=value==='destination'?(d&&!d.manual?'Destination selected · direction only, not a road route':'Choose a destination below to filter stations in that direction.'):'Find stations around your chosen location.';
};
function makeJourney(){
 const mode=$('journeyMode'),area=$('areaModal');if(!mode||!area||journeyReady||!window.FMNUnifiedSearch)return false;
 const original=mode.closest('label');if(!original)return false;
 original.classList.add('fmn-native-select-hidden');
 mode.tabIndex=-1;mode.setAttribute('aria-hidden','true');
 const choice=elt('fieldset','fmn-journey-buttons');choice.id='fmnJourneyButtons';
 choice.append(elt('legend','fmn-journey-label','Where are you travelling?'));
 const wrap=elt('div','fmn-journey-button-row');
 for(const [kind,label] of [['nearby','Nearby'],['destination','On my way']]){
  const b=elt('button','fmn-journey-choice',label);b.type='button';b.dataset.journey=kind;b.id=kind==='nearby'?'fmnJourneyNearby':'fmnJourneyOnWay';
  b.setAttribute('aria-pressed','false');
  b.onclick=()=>{if(mode.value!==kind){mode.value=kind;mode.dispatchEvent(new Event('change',{bubbles:true}));}syncJourney();};
  wrap.append(b);radio.push(b);
 }
 choice.append(wrap);
 const status=elt('p','fmn-journey-status');status.id='fmnJourneyStatus';status.setAttribute('role','status');choice.append(status);
 original.before(choice);
 const observer=new MutationObserver(()=>{if(area.classList.contains('open'))syncJourney()});
 observer.observe(area,{attributes:true,attributeFilter:['class']});
 document.addEventListener('fmn:destination',syncJourney);
 mode.addEventListener('change',syncJourney);
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 journeyReady=true;syncJourney();
 return true;
}
function setPressed(b,yes){if(!b)return;b.setAttribute('aria-pressed',String(yes));b.classList.toggle('active',yes);}
function syncQuick(){
 if(!quickReady||!window.FMNNearbyUI)return;
 const f=current(),dest=window.FMNJourney?.getDestination?.();
 setPressed(chips.value,f.sort==='value');setPressed(chips.price,f.sort==='price');
 setPressed(chips.towards,f.travel==='towards'&&!!dest&&!dest.manual);
 chips.towards.title=dest&&!dest.manual?'Limit to stations toward '+dest.label+' (direction only)':'Choose a destination to filter toward it';
 chips.towards.setAttribute('aria-label',chips.towards.title);
 const hint=$('fmnQuickHint');if(hint){const text=f.travel==='towards'&&dest&&!dest.manual?'Toward '+dest.label+' · approximate direction only':(f.sort==='price'?'Lowest pump price first':'Estimated value includes driving cost');if(hint.textContent!==text)hint.textContent=text;}
}
function openJourneySearch(){
 if(document.body.dataset.page!=='explore')document.querySelector('.nav[data-page=explore]')?.click();
 setTimeout(()=>{
  if(!$('areaModal')?.classList.contains('open'))$('topArea')?.click();
  setTimeout(()=>{const b=$('fmnJourneyOnWay');if(b)b.click();else $('journeyMode')?.dispatchEvent(new Event('change',{bubbles:true}));$('journeyInput')?.focus();},80);
 },90);
}
function quickFilter(partial){
 const applied=window.FMNNearbyUI?.setQuickFilters?.(partial);
 if(applied!==true)return false;
 syncQuick();return true;
}
function makeQuick(){
 const toolbar=$('nearbyToolbar'),api=window.FMNNearbyUI;if(!toolbar||!api||quickReady)return false;
 const row=elt('div','fmn-quick-actions');row.id='fmnQuickActions';row.setAttribute('role','group');row.setAttribute('aria-label','Quick nearby filters');
 const make=(key,name,fn)=>{
  const b=elt('button','fmn-quick-button',name);b.type='button';b.setAttribute('aria-pressed','false');b.onclick=fn;row.append(b);chips[key]=b;return b;};
 make('value','Best Value',()=>quickFilter({sort:'value'}));
 make('price','Cheapest',()=>quickFilter({sort:'price'}));
 make('towards','On My Way',()=>{
  const f=current(),dest=window.FMNJourney?.getDestination?.();
  if(!dest||dest.manual){openJourneySearch();return;}
  quickFilter({travel:f.travel==='towards'?'all':'towards'});
 });
 const more=make('filters','Filters',()=>{const btn=$('nearbyFilterButton');btn?.click();setTimeout(installReset,40);});
 more.removeAttribute('aria-pressed');
 toolbar.prepend(row);
 const hint=elt('p','fmn-quick-hint');hint.id='fmnQuickHint';row.after(hint);
 const summary=$('nearbyFilterSummary');if(summary)summary.classList.add('fmn-secondary-summary');
 const observer=new MutationObserver(syncQuick);
 if(summary)observer.observe(summary,{childList:true,subtree:true,characterData:true});
 document.addEventListener('fmn:destination',syncQuick);
 window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
 quickReady=true;syncQuick();
 return true;
}
function installReset(){
 const d=$('nearbyDialog');if(!d?.open||d.querySelector('#fmnResetInsideFilters'))return;
 const foot=d.querySelector('footer');if(!foot)return;
 const reset=elt('button','fmn-reset-inside','Reset filters');reset.id='fmnResetInsideFilters';reset.type='button';
 reset.onclick=()=>{d.close();$('nearbyReset')?.click();syncQuick();};
 foot.insertBefore(reset,foot.lastElementChild||null);
}
function start(){
 if(makeJourney()&&makeQuick()){document.addEventListener('click',e=>{if(e.target.closest('#nearbyFilterButton,#fmnQuickActions'))setTimeout(installReset,60)},true);return;}
 let tries=0;const t=setInterval(()=>{makeJourney();makeQuick();if((journeyReady&&quickReady)||++tries>75){clearInterval(t);if(quickReady)document.addEventListener('click',e=>{if(e.target.closest('#nearbyFilterButton,#fmnQuickActions'))setTimeout(installReset,60)},true);}},160);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
window.FMNQuickControls={sync:syncQuick,openJourney:openJourneySearch};
})();
