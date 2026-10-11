/* Installed FillMeNow: unified Search form. Reuse live app selectors/preferences and native journey controls. */
(function(){
'use strict';
const $=id=>document.getElementById(id);
const types=[['car','Car'],['ute','Ute / van'],['truck','Truck'],['heavy','Heavy truck'],['custom','Custom']];
const radii=[5,10,20,30,50,100];
const truckKinds=[['rigid','Rigid truck'],['articulated','Articulated / semi'],['b-double','B-double'],['road-train','Road train'],['other','Other']];
let panel,details,area,vehicleSelect,radiusSelect,statusNode,summaryNode,ready=false;
const app=()=>window.FMNNearbyApp;
const isTruck=p=>p&&['truck','heavy'].includes(p.vehicle);
function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;}
function field(id,label,options,cl){const wrap=node('label','fmn-search-field '+(cl||''));wrap.append(node('span','fmn-search-label',label));const e=node('select');e.id=id;options.forEach(([value,text])=>{const o=node('option',null,text);o.value=String(value);e.append(o)});wrap.append(e);return wrap;}
function numeric(id,label,min,max,step){const n=node('label','fmn-search-field');n.append(node('span','fmn-search-label',label));const i=node('input');i.id=id;i.type='number';i.inputMode='decimal';i.min=String(min);i.max=String(max);i.step=String(step);i.required=true;n.append(i);return n;}
function tell(message,error){statusNode.textContent=message;statusNode.dataset.error=String(!!error);}
function fillFor(p){const names={car:'Car',ute:'Ute / van',truck:'Truck',heavy:'Heavy truck',custom:'Custom'};return (names[p.vehicle]||'Vehicle')+' · '+p.tank+' L · '+p.economy+' L/100 km'+(isTruck(p)&&p.truck?.height?' · '+p.truck.height+' m high':'');}
function sync(force){
 if(!ready||!app())return;
 const p=app().getPrefs();
 vehicleSelect.value=p.vehicle||'car';radiusSelect.value=String(p.radius);
 // Fuel is the actual modalFuel element, already updated by the shared application.
 const inputs={fmnSearchTank:p.tank,fmnSearchEconomy:p.economy,fmnSearchTruckConfiguration:p.truck?.configuration||'rigid',fmnSearchTruckHeight:p.truck?.height||'',fmnSearchTruckWidth:p.truck?.width||'',fmnSearchTruckLength:p.truck?.length||'',fmnSearchTruckWeight:p.truck?.weight||''};
 for(const [id,value] of Object.entries(inputs)){const n=$(id);if(n&&(force||!details.open||document.activeElement!==n))n.value=String(value);}
 $('fmnSearchTruckFields').hidden=!isTruck(p);
 summaryNode.textContent=fillFor(p);
}
function save(){
 if(!app())return false;
 const p=app().getPrefs(),tank=$('fmnSearchTank'),economy=$('fmnSearchEconomy');
 for(const n of [tank,economy])if(!n.value.trim()||!n.checkValidity()){tell('Enter a valid '+(n===tank?'fill size':'fuel use')+' before saving.',true);n.focus();return false;}
 let truck=p.truck||null;
 if(isTruck(p)){
  const raw={configuration:$('fmnSearchTruckConfiguration').value,height:$('fmnSearchTruckHeight').value,width:$('fmnSearchTruckWidth').value,length:$('fmnSearchTruckLength').value,weight:$('fmnSearchTruckWeight').value};
  const valid=window.FMNNearbyCore?.validateTruck(raw);
  if(!valid?.ok){const missing=valid?.field||'dimensions';tell('Check your truck '+missing+'. All dimensions are required.',true);const focus=$('fmnSearchTruck'+missing.charAt(0).toUpperCase()+missing.slice(1));focus?.focus();return false;}
  truck=valid.truck;
 }
 const value={vehicle:p.vehicle,tank:Number(tank.value),economy:Number(economy.value),truck};
 const saved=app().saveVehicleQuiet(value);
 if(!saved){tell('Changes were not saved. Check device storage and try again.',true);return false;}
 for(const [id,val] of [['tankInput',value.tank],['economyInput',value.economy],['truckConfiguration',truck?.configuration||'rigid'],['truckHeight',truck?.height||''],['truckWidth',truck?.width||''],['truckLength',truck?.length||''],['truckWeight',truck?.weight||'']]){const e=$(id);if(e)e.value=String(val);}
 try{localStorage.removeItem('fmnVehicleDraft')}catch{}
 app().refreshResults?.();
 tell('Saved. These settings are used for Best Stop and nearby prices.',false);sync(true);
 return true;
}
function build(){
 area=$('areaModal');const scroll=area?.querySelector('.popup-scroll');
 if(!scroll||!app()||!window.FMNJourney||!scroll.querySelector('.journey-fields')||!$('modalFuel'))return false;
 if($('fmnUnifiedVehicle'))return true;
 const title=area.querySelector('.location-heading h2');if(title)title.textContent='Find fuel';
 area.setAttribute('aria-label','Search fuel, vehicle and journey');
 const body=Array.from(scroll.children),journey=scroll.querySelector('.journey-fields');
 const fuelField=$('modalFuel').closest('.field'),stateField=$('stateSelect').closest('.field');
 const vehicle=node('section','fmn-unified-section');vehicle.id='fmnUnifiedVehicle';
 vehicle.append(node('h3',null,'Your vehicle & fuel'),node('p','fmn-section-desc','Used for nearby results and Best Stop calculations.'));
 const fields=node('div','fmn-unified-grid');
 const kind=field('fmnSearchVehicle','Vehicle',types,'fmn-full');vehicleSelect=kind.querySelector('select');fields.append(kind);
 const fuelHost=node('div','fmn-search-field');fuelHost.append(node('label','fmn-search-label','Fuel type'));fuelHost.querySelector('label').htmlFor='modalFuel';
 fuelField.querySelector('label')?.remove();fuelHost.append($('modalFuel'));fuelField.remove();fields.append(fuelHost);
 const radius=field('fmnSearchRadius','Search radius',radii.map(x=>[String(x),x+' km']));radiusSelect=radius.querySelector('select');fields.append(radius);
 vehicle.append(fields);
 details=node('details','fmn-vehicle-details');details.id='fmnSearchDetails';
 const sum=node('summary');sum.append(node('strong',null,'Fill size & vehicle details'));summaryNode=node('span','fmn-vehicle-brief');sum.append(summaryNode);details.append(sum);
 const inside=node('div','fmn-vehicle-detail-body');
 const two=node('div','fmn-unified-grid');two.append(numeric('fmnSearchTank','Typical fill (L)',20,1500,1),numeric('fmnSearchEconomy','Fuel use (L/100 km)',2,80,0.1));inside.append(two);
 const truck=node('div','fmn-truck-search');truck.id='fmnSearchTruckFields';
 const config=field('fmnSearchTruckConfiguration','Configuration',truckKinds,'fmn-full');truck.append(config);
 const dims=node('div','fmn-unified-grid');
 dims.append(numeric('fmnSearchTruckHeight','Height (m)',0.5,10,0.01),numeric('fmnSearchTruckWidth','Width (m)',0.5,10,0.01),numeric('fmnSearchTruckLength','Total length (m)',1,70,0.01),numeric('fmnSearchTruckWeight','Loaded weight (t)',0.5,300,0.01));
 truck.append(dims,node('p','fmn-help-note','Truck facilities are listed separately from confirmed height and route clearance. Check access details before travelling.'));
 inside.append(truck);
 const saveButton=node('button','fmn-save-vehicle','Save vehicle settings');saveButton.type='button';saveButton.id='fmnSearchSave';inside.append(saveButton);
 statusNode=node('p','fmn-search-save-status','Your saved settings are used throughout the app.');statusNode.id='fmnSearchSaveStatus';statusNode.role='status';statusNode.setAttribute('aria-live','polite');inside.append(statusNode);details.append(inside);
 vehicle.append(details);
 const location=node('section','fmn-unified-section');location.id='fmnUnifiedJourney';
 location.append(node('h3',null,'Your location & journey'));
 const description=node('p','fmn-section-desc','Use your location, choose a suburb, or add a destination.');
 location.append(description);
 // Moving original fields retains their registered listeners, native GPS and geocoding.
 for(const child of body){
  if(child===journey)location.append(child);
  else if(child.classList?.contains('form-grid')){child.remove();location.append(stateField);}
  else if(child!==fuelField&&!child.classList?.contains('journey-fields')&&child.tagName!=='P')location.append(child);
  else if(child.tagName==='P')child.remove();
 }
 scroll.replaceChildren(vehicle,location);
 stateField.classList.add('fmn-state-field');
 const gps=$('areaGps');if(gps){gps.classList.add('fmn-location-action');gps.type='button';}
 const label=$('stateSelect')?.previousElementSibling;if(label?.tagName==='LABEL')label.htmlFor='stateSelect';
 const searchLabel=$('locationSearch')?.previousElementSibling;if(searchLabel?.tagName==='LABEL')searchLabel.htmlFor='locationSearch';
 kind.querySelector('select').addEventListener('change',()=>{
  if(!app())return;app().setVehicle(vehicleSelect.value);tell('Vehicle selected. Check your fill and dimensions below.',false);sync(true);
 });
 radiusSelect.addEventListener('change',()=>{
  const proxy=$('mobileRadiusSelect')||$('radiusSelect');if(!proxy)return;
  proxy.value=radiusSelect.value;proxy.dispatchEvent(new Event('change',{bubbles:true}));sync();
 });
 saveButton.addEventListener('click',save);
 inside.addEventListener('change',e=>{
  if(e.target.matches('input[type=number],select'))save();
 });
 const areaObserver=new MutationObserver(()=>{if(area.classList.contains('open')){sync(true);tell('Your saved settings are used throughout the app.',false);}});
 areaObserver.observe(area,{attributes:true,attributeFilter:['class']});
 const fuelObserver=new MutationObserver(()=>{if(area.classList.contains('open')){if(!details.open)sync();}});
 fuelObserver.observe($('modalFuel'),{childList:true});
 $('modalFuel').addEventListener('change',()=>{setTimeout(()=>sync(),0);});
 if($('mobileVehicleBtn'))$('mobileVehicleBtn').addEventListener('click',e=>{e.stopImmediatePropagation();window.FMNUnifiedSearch.openVehicle();},true);
 ready=true;sync(true);
 window.addEventListener('pagehide',()=>{areaObserver.disconnect();fuelObserver.disconnect();},{once:true});
 return true;
}
function openVehicle(){const button=$('topArea');if(!area?.classList.contains('open'))button?.click();details.open=true;sync(true);details.scrollIntoView({block:'nearest'});}
function start(){if(build())return;let tries=0;const tick=setInterval(()=>{if(build()||++tries>40)clearInterval(tick);},200);}
window.FMNUnifiedSearch={openVehicle,save,sync};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
