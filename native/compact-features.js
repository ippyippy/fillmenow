/* Native control layout. Reuse the existing location, preference and filter APIs. */
(function(){'use strict';
const $=id=>document.getElementById(id);
const node=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
let mounted=false,opener,area,refine,status,result,controls={};
function syncFilters(){
 const f=window.FMNNearbyUI.getFilters();
 for(const [key,input] of Object.entries(controls))input.value=String(f[key]);
 controls.access.closest('label').hidden=!window.FMNNearbyCore.truckMode(window.FMNNearbyApp.getPrefs());
}
function updateCount(){if(result)result.textContent=($('statCount')?.textContent||'0')+' stations';}
function open(filters=false){
 if(!mounted)return;
 window.FMNMapClarity?.hide();
 if(!area.classList.contains('open'))$('topArea').click();
 syncFilters();
 if(filters){refine.open=true;refine.scrollIntoView({block:'nearest'});}
}
function mount(){
 if(mounted)return true;
 area=$('areaModal');opener=$('mapFiltersQuick');
 const locate=$('recenterBtn'),header=document.querySelector('.topbar.app-topbar');
 if(!area||!opener||!header||!locate||!$('nativeStatus')||!$('fmnJourneyButtons')||!$('fmnUnifiedVehicle')||!$('fmnUnifiedJourney')||!$('fmnSearchDetails')||!window.FMNUnifiedSearch||!window.FMNNearbyUI?.setQuickFilters)return false;
 document.documentElement.dataset.compactFeatures='1';
 // Move the live control itself so its GPS subscription and click handler survive.
 header.append(locate);locate.classList.add('fmn-header-locate');
 const legacy=$('topArea');legacy.hidden=true;legacy.tabIndex=-1;legacy.setAttribute('aria-hidden','true');
 const gear=$('mapSettingsBtn');if(gear)gear.remove();
 document.querySelector('#page-explore .map-shell').append(opener);
 opener.append(node('span',null,'Features'));opener.title='Vehicle, fuel, location, journey and filters';
 opener.setAttribute('aria-controls','areaModal');opener.setAttribute('aria-expanded','false');opener.onclick=()=>open();
 const label=()=>{const value='Features. Vehicle, fuel, location, journey and station filters';if(opener.getAttribute('aria-label')!==value)opener.setAttribute('aria-label',value);};
 document.addEventListener('fmn:scope-change',()=>{label();updateCount();});label();
 $('areaTitle').textContent='Features';area.setAttribute('aria-label','Vehicle, fuel, location, journey and filters');
 $('fmnUnifiedVehicle').querySelector('h3').textContent='Vehicle & fuel';
 $('fmnUnifiedJourney').querySelector('h3').textContent='Location & journey';
 $('fmnSearchDetails').querySelector('summary strong').textContent='Vehicle details';
 const origin=node('div','fmn-origin-grid'),state=$('stateSelect').closest('.field'),suburb=$('locationSearch').closest('.field');
 state.before(origin);origin.append(state,suburb);
 state.querySelector('label').textContent='State';suburb.querySelector('label').textContent='Suburb or postcode';
 $('areaGps').textContent='Use my location';
 const help=$('locationHelp');if(help){help.textContent='GPS help';$('areaGps').parentElement.append(help);}
 // Popular places remain available, without pushing the everyday controls away.
 const regions=$('regions'),regionTitle=area.querySelector('.region-heading');
 if(regions&&regionTitle){const popular=node('details','fmn-feature-details');popular.id='fmnPopularAreas';popular.append(node('summary',null,'Popular areas'));regionTitle.before(popular);popular.append(regions);regionTitle.remove();}
 const footer=area.querySelector('.popup-footer');result=node('span','fmn-features-count');result.id='fmnFeaturesCount';result.setAttribute('aria-live','polite');footer.prepend(result);$('areaClose').textContent='Done';
 const stationFooter=$('stationModal')?.querySelector('.popup-footer');if(stationFooter&&$('stationGo')){stationFooter.append($('stationGo'));$('stationGo').textContent='Directions';}
 const scroll=area.querySelector('.popup-scroll');refine=node('details','fmn-feature-details');refine.id='fmnFeatureRefine';refine.append(node('summary',null,'Station filters'));
 const form=node('form','fmn-refine-form'),grid=node('div','fmn-unified-grid');form.id='fmnFeatureFilterForm';
 function select(key,title,options,wide=false){const label=node('label','fmn-search-field'+(wide?' fmn-full':''));label.append(node('span','fmn-search-label',title));const el=node('select');el.id='fmnFeature'+key[0].toUpperCase()+key.slice(1);for(const [value,text] of options){const o=node('option',null,text);o.value=value;el.append(o);}controls[key]=el;label.append(el);grid.append(label);}
 select('sort','Sort stations',[['value','Best value'],['price','Lowest price'],['distance','Nearest'],['deal','Best eligible offer']]);
 select('deals','Offers',[['all','All stations'],['active','Active offers'],['eligible','Eligible offers']]);
 select('access','Truck access',[['truckstops','Truck facilities'],['height','Recorded height'],['matches','Recorded full fit']],true);
 for(const [key,title,min] of [['minKm','From (km)',0],['maxKm','To (km)',1]]){const label=node('label','fmn-search-field');label.append(node('span','fmn-search-label',title));const input=node('input');input.id='fmnFeature'+key[0].toUpperCase()+key.slice(1);input.type='number';input.inputMode='decimal';input.min=String(min);input.max='100';input.step='0.1';input.required=true;controls[key]=input;label.append(input);grid.append(label);}
 form.append(grid,node('p','fmn-help-note','Distance is straight-line. Truck listings do not confirm full access.'));
 const actions=node('div','fmn-refine-actions'),reset=node('button',null,'Reset filters'),apply=node('button',null,'Apply filters');reset.type='button';reset.id='fmnFeatureReset';apply.type='submit';apply.id='fmnFeatureApply';actions.append(reset,apply);form.append(actions);
 status=node('p','fmn-feature-status');status.id='fmnFeatureStatus';status.role='status';form.append(status);refine.append(form);scroll.append(refine);
 reset.onclick=()=>{$('nearbyReset').click();syncFilters();status.textContent='Filters reset.';};
 form.onsubmit=e=>{e.preventDefault();if(!form.reportValidity())return;const min=Number(controls.minKm.value),max=Number(controls.maxKm.value);if(min>max){status.textContent='From must be less than or equal to To.';controls.minKm.focus();return;}const values={sort:controls.sort.value,deals:controls.deals.value,minKm:min,maxKm:max};if(window.FMNNearbyCore.truckMode(window.FMNNearbyApp.getPrefs()))values.access=controls.access.value;window.FMNNearbyApp.applyRadius(Math.max(window.FMNNearbyApp.getPrefs().radius,[5,10,20,30,50,100].find(x=>x>=max)||100));window.FMNNearbyUI.setQuickFilters(values);syncFilters();status.textContent='Applied to map, Nearby and Best Stop.';};
 $('fmnSearchRadius').addEventListener('change',()=>setTimeout(syncFilters,0));$('fmnSearchVehicle').addEventListener('change',()=>setTimeout(syncFilters,0));
 const observer=new MutationObserver(()=>{const showing=area.classList.contains('open');opener.setAttribute('aria-expanded',String(showing));if(showing){syncFilters();updateCount();}else if(document.body.dataset.page==='explore'){opener.focus({preventScroll:true});}});observer.observe(area,{attributes:true,attributeFilter:['class']});
 const countObserver=new MutationObserver(updateCount);countObserver.observe($('statCount'),{childList:true,characterData:true,subtree:true});
 window.addEventListener('pagehide',()=>{observer.disconnect();countObserver.disconnect();},{once:true});
 mounted=true;window.FMNFeatures.ready=true;syncFilters();updateCount();return true;
}
function start(){if(mount())return;let tries=0;const timer=setInterval(()=>{if(mount()||++tries>75)clearInterval(timer);},160);}
window.FMNFeatures={open};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
