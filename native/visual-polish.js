/* Native presentation adapter. Does not acquire GPS, persist settings or change ranking rules. */
(function(){'use strict';
function init(){
 if(document.getElementById('nativeStatus'))return true;
 const locate=document.getElementById('recenterBtn'),oldToggle=document.getElementById('followToggle'),detail=document.getElementById('followStatus');
 if(!locate||!oldToggle||!detail||!window.FMNLiveLocation)return false;
 document.documentElement.dataset.nativePolish='1.2.1';
 const pill=document.createElement('button');pill.id='nativeStatus';pill.type='button';pill.hidden=true;
 detail.after(pill);
 let lastText='',hideTimer=null;
 const set=(node,value)=>{if(node.textContent!==value)node.textContent=value;};
 function sync(){
  const s=window.FMNLiveLocation.getState(),raw=detail.textContent.trim();
  const active=s.following,waiting=s.wanted&&s.locked&&!active,paused=s.wanted&&!s.locked;
  const label=active?'Following':paused?'Resume':waiting?'Locating…':'Locate me';
  const span=locate.querySelector('span');if(span)set(span,label);
  locate.setAttribute('aria-pressed',String(active));
  locate.setAttribute('aria-label',active?'Following. Tap to stop location.':paused?'Resume location following':waiting?'Cancel location search':'Find and centre my precise location');
  locate.title=active?'Tap to stop GPS':paused?'Resume following':waiting?'Tap to cancel':'Centre and follow my location';
  const warning=['coarse','stale','denied','unavailable','error','unsupported'].includes(s.quality);
  const accuracy=raw.match(/±\s*(\d+)\s*m/);
  const text=warning?(s.quality==='denied'?'Allow precise GPS':s.quality==='coarse'?'GPS weak · tap for help':s.quality==='stale'?'GPS signal lost':'GPS needs attention'):active?(accuracy?'GPS ±'+accuracy[1]+' m':'Following your location'):paused?'Map browsing · tap Resume':waiting?'Finding precise GPS…':raw?'Location paused':'';
  set(pill,text);pill.dataset.kind=warning?'warning':active?'precise':'neutral';pill.setAttribute('aria-label',text+(warning?'. Open location help.':s.wanted?'. Location details.':'. Tap to resume.'));
  if(raw!==lastText){clearTimeout(hideTimer);lastText=raw;pill.hidden=!text;if(text&&!warning&&!s.wanted)hideTimer=setTimeout(()=>{if(!window.FMNLiveLocation.getState().wanted)pill.hidden=true;},8000);}
  if(s.wanted||warning)pill.hidden=false;
 }
 locate.onclick=function(){const s=window.FMNLiveLocation.getState();if(s.wanted&&s.locked)window.FMNLiveLocation.stop('Location paused. Tap Locate to resume.');else window.FMNLiveLocation.start();sync();};
 pill.onclick=function(){const s=window.FMNLiveLocation.getState();if(!s.wanted&&s.quality==='off')window.FMNLiveLocation.start();else if(s.wanted&&!s.locked)window.FMNLiveLocation.start();else window.FMNPermissionUI?.open();};
 const observer=new MutationObserver(sync);observer.observe(detail,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-quality','hidden']});observer.observe(oldToggle,{childList:true,subtree:true,attributes:true,attributeFilter:['aria-pressed']});
 sync();
 const cards=document.querySelectorAll('#page-more .menu-card');
 ['Your vehicle & fuel','Help & app settings'].forEach((label,i)=>{if(!cards[i])return;const heading=document.createElement('h2');heading.textContent=label;heading.style.cssText='font-size:14px;margin:18px 0 8px;color:#526057;font-weight:700';cards[i].before(heading);});
 const head=document.querySelector('#drawer-vehicle>h2');if(head)head.setAttribute('class','native-vehicle-heading');
 const rootObserver=new ResizeObserver(()=>{requestAnimationFrame(()=>window.FMNJourneyApp?.getMap()?.resize());});const shell=document.querySelector('#page-explore .map-shell');if(shell)rootObserver.observe(shell);
 window.addEventListener('pagehide',()=>{clearTimeout(hideTimer);observer.disconnect();rootObserver.disconnect();},{once:true});
 return true;
}
function mount(){if(init())return;const pending=new MutationObserver(()=>{if(init())pending.disconnect();});pending.observe(document.body,{childList:true,subtree:true});setTimeout(()=>pending.disconnect(),15000);}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
