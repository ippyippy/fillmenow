/* Native map presentation only. GPS and price/ranking acquisition remain in the existing app. */
(function(){'use strict';
let bubble,tail,dock,quick,timer,frame=0,lastKey='',suppressed='',scope=null,map=null;
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(Math.max(a,b),v));
function hide(){if(bubble)bubble.hidden=true;if(tail)tail.setAttribute('hidden','');clearTimeout(timer);if(scope)suppressed=scope.key;}
function position(){frame=0;if(!bubble||bubble.hidden)return;const host=$('exploreMap'),sheet=$('mobileSheet');if(!host||!sheet||document.body.dataset.page!=='explore'){hide();return;}
 const m=host.getBoundingClientRect(),s=sheet.getBoundingClientRect();let mouth;
 if(sheet.classList.contains('is-collapsed'))mouth={x:s.left+s.width*.56,y:s.top+s.height*.68};
 else mouth={x:s.right-16-48,y:s.top-36+76*.68};
 const w=Math.min(224,m.width-24);bubble.style.width=w+'px';const h=bubble.getBoundingClientRect().height;
 let x=mouth.x>w+32?mouth.x-w-26:mouth.x+24;
 x=clamp(x,m.left+12,m.right-w-12);
 const dockTop=dock?.getBoundingClientRect().top||m.bottom;let y=mouth.y-h-40;
 y=clamp(y,m.top+12,Math.min(m.bottom-12,dockTop-8)-h);
 bubble.style.left=Math.round(x)+'px';bubble.style.top=Math.round(y)+'px';
 // A narrow speech tail points to the mouth in the unchanged Dash artwork.
 const b=bubble.getBoundingClientRect(),below=mouth.y>=b.bottom,above=mouth.y<=b.top;
 let a,c;
 if(below||above){const yy=below?b.bottom-1:b.top+1,xx=clamp(mouth.x,b.left+18,b.right-18);a=[xx-6,yy];c=[xx+6,yy];}
 else{const xx=mouth.x>=b.right?b.right-1:b.left+1,yy=clamp(mouth.y,b.top+14,b.bottom-14);a=[xx,yy-6];c=[xx,yy+6];}
 tail.setAttribute('viewBox','0 0 '+innerWidth+' '+innerHeight);tail.querySelector('path').setAttribute('d','M '+a.join(' ')+' L '+Math.round(mouth.x)+' '+Math.round(mouth.y)+' L '+c.join(' ')+' Z');
 tail.removeAttribute('hidden');
}
function queue(){if(!frame)frame=requestAnimationFrame(position);}
function receive(detail){if(!detail)return;scope=detail;window.FMNMapScope=detail;
 if(quick)quick.setAttribute('aria-label','Filters. '+detail.fullText);
 if(!bubble)return;
 const changed=detail.key!==lastKey;lastKey=detail.key;
 if(!detail.active){hide();return;}
 const title=detail.destination?'Towards '+detail.destination:detail.truck?'Truck facilities only':'Your map filters';
 $('dashSpeechTitle').textContent=title;
 $('dashSpeechBody').textContent=detail.truck?'Showing recorded truck facilities.':detail.deals?'Showing checked offers.':'Showing your filtered stations.';
 $('dashSpeechFoot').textContent=(detail.destination?'Direction filter, not a road route. ':'')+'Tap for filters.';
 bubble.setAttribute('aria-label',title+'. '+$('dashSpeechBody').textContent+' '+$('dashSpeechFoot').textContent);
 if(changed&&suppressed!==detail.key&&document.body.dataset.page==='explore'){bubble.hidden=false;queue();clearTimeout(timer);timer=setTimeout(hide,8000);}
 else if(!bubble.hidden)queue();
}
function bindMap(){const candidate=window.FMNJourneyApp?.getMap();if(!candidate||candidate===map)return;map=candidate;map.on('click',hide);map.on('dragstart',hide);map.on('zoomstart',hide);}
function init(){const host=document.querySelector('#page-explore .map-shell'),count=$('mapStationCount');if(!host||!count)return;
 dock=document.createElement('div');dock.id='mapBottomDock';host.append(dock);dock.append(count);
 quick=document.createElement('button');quick.id='mapFiltersQuick';quick.type='button';quick.setAttribute('aria-label','Open map filters');quick.setAttribute('aria-haspopup','dialog');quick.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6h16M4 12h16M4 18h16" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8" cy="6" r="2" fill="white" stroke="currentColor" stroke-width="2"/><circle cx="16" cy="12" r="2" fill="white" stroke="currentColor" stroke-width="2"/><circle cx="10" cy="18" r="2" fill="white" stroke="currentColor" stroke-width="2"/></svg>';quick.onclick=()=>{hide();window.FMNNearbyUI?.openFilters();};dock.append(quick);
 tail=document.createElementNS('http://www.w3.org/2000/svg','svg');tail.id='dashSpeechTail';tail.setAttribute('aria-hidden','true');tail.innerHTML='<path fill="white" stroke="#bfd0c3" stroke-width="1"/>';tail.setAttribute('hidden','');document.body.append(tail);
 bubble=document.createElement('button');bubble.id='dashSpeech';bubble.type='button';bubble.hidden=true;bubble.setAttribute('aria-label','Dash explains the active map filters. Tap to change filters.');bubble.innerHTML='<strong id="dashSpeechTitle"></strong><span id="dashSpeechBody"></span><small id="dashSpeechFoot"></small>';bubble.onclick=()=>{hide();window.FMNNearbyUI?.openFilters();};document.body.append(bubble);
 const sheet=$('mobileSheet');if(sheet)new MutationObserver(queue).observe(sheet,{attributes:true,attributeFilter:['class','style']});
 document.addEventListener('fmn:scope-change',e=>receive(e.detail));document.addEventListener('fmn:map-ready',bindMap);bindMap();
 $('exploreMap').addEventListener('pointerdown',e=>{if(e.target.closest('.maplibregl-canvas'))hide();},{passive:true});
 document.addEventListener('pointermove',()=>{if(sheet?.classList.contains('is-dragging'))queue();},{passive:true});
 new MutationObserver(()=>{if(document.body.dataset.page!=='explore')hide();}).observe(document.body,{attributes:true,attributeFilter:['data-page']});
 window.addEventListener('resize',queue);window.addEventListener('pagehide',hide);if(window.visualViewport)window.visualViewport.addEventListener('resize',queue);
 if(window.FMNMapScope)receive(window.FMNMapScope);
 window.FMNMapClarity={receive,hide,position};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
