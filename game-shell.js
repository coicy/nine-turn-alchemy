(() => {
'use strict';
const forge=document.querySelector('.forge-panel'),layout=document.querySelector('.game-layout');
const viewport=document.createElement('div');viewport.className='engine-viewport';layout.append(viewport);viewport.append(forge);document.body.classList.add('engine-shell','object-world');
const panels={orders:document.querySelector('.counter-board'),shop:document.querySelector('.economy-board'),equipment:document.querySelector('.equipment-drawer'),record:document.querySelector('.order-panel'),manual:document.querySelector('.side-panel'),bag:document.querySelector('.pill-bag-panel')};
const places=['work','orders','shop'],labels={work:'炼丹房',orders:'接待柜台',shop:'坊市',equipment:'炉旁法器',record:'经营簿',manual:'丹纹炉谱',bag:'丹药背包'};
const nav=document.createElement('nav');nav.className='engine-nav';nav.setAttribute('aria-label','丹坊功能');
nav.innerHTML='<button class="world-location-toggle" aria-expanded="false" aria-controls="worldLocationMenu">炼丹房 ▾</button><div id="worldLocationMenu" hidden>'+Object.entries(labels).map(([id,name])=>`<button data-view="${id}" aria-pressed="false">${name}</button>`).join('')+'</div><span id="engineWallet"></span><button class="world-settings-toggle" aria-expanded="false" aria-controls="worldSettings">设置</button><div id="worldSettings" hidden></div>';
document.querySelector('.topbar').after(nav);
const menu=nav.querySelector('#worldLocationMenu'),settings=nav.querySelector('#worldSettings');
const close=document.createElement('button');close.className='engine-close';close.textContent='合上 ×';close.hidden=true;document.body.append(close);
let current='work',location='work',requested='work',phase='idle',returnFocus=null,returnSlot=null,serial=0;
function fit(){window.AlchemyWorldLayout.fit();}
function movable(){return !window.AlchemyGame.snapshot().busy&&!window.AlchemyGame.snapshot().runeChoices?.length&&!window.AlchemyScene2D?.busy&&!window.AlchemyScene2D?.held&&!window.AlchemyInteractionBusy;}
function setMenu(open){menu.hidden=!open;nav.querySelector('.world-location-toggle').setAttribute('aria-expanded',String(open));}
function closeReading(){if(places.includes(current))return;const focus=returnFocus;show(location,true);requestAnimationFrame(()=>{const anchor=focus?.isConnected?focus:returnSlot!==null?document.querySelector('.world-tool-row')?.children[returnSlot]:document.querySelector('.world-location-toggle');if(anchor?.checkVisibility())anchor.focus({preventScroll:true});});}
function show(view,internal=false){
 if(view!=='work'&&!panels[view])return false;
 if(!internal&&!movable()){const hint=document.getElementById('workInstruction');if(hint)hint.textContent='请先完成本次操作，或按 Esc 放回手中物件';return false;}
 const reading=!places.includes(view);if(view==='equipment')location='work';if(!reading)location=view;else if(places.includes(current)){returnFocus=document.activeElement;returnSlot=returnFocus?.dataset?.worldTool?Array.from(returnFocus.parentElement.children).indexOf(returnFocus):null;}
 requested=view;phase='leaving';document.body.dataset.viewPhase=phase;const ticket=++serial;
 current=view;document.body.dataset.worldLocation=location;document.body.dataset.worldSurface=reading?view:'';
 for(const [key,p] of Object.entries(panels)){if(!p)continue;const active=key===view||key===location;p.classList.add('engine-panel');p.hidden=!active;p.dataset.shellActive=String(active);p.inert=reading&&key===location;if(p.tagName==='DETAILS')p.open=true;}
 viewport.style.visibility=location==='work'?'visible':'hidden';viewport.inert=reading;
 document.body.classList.toggle('equipment-open',view==='equipment');close.hidden=!reading||['equipment','bag'].includes(view);
 nav.querySelector('.world-location-toggle').textContent=labels[location]+' ▾';nav.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));setMenu(false);settings.hidden=true;nav.querySelector('.world-settings-toggle').setAttribute('aria-expanded','false');
 fit();phase='entering';document.body.dataset.viewPhase=phase;
 queueMicrotask(()=>{if(ticket!==serial)return;phase='idle';document.body.dataset.viewPhase=phase;window.dispatchEvent(new CustomEvent('alchemy:view-ready',{detail:{view,location}}));if(reading){const p=panels[view];p.setAttribute('tabindex','-1');p.focus({preventScroll:true});}});return true;
}
window.AlchemyViewState={snapshot:()=>({current,requested,phase,location}),navigate:view=>show(view),close:closeReading};
nav.querySelector('.world-location-toggle').onclick=()=>{setMenu(menu.hidden);if(!menu.hidden)menu.querySelector('button').focus();};
nav.querySelector('.world-settings-toggle').onclick=()=>{settings.hidden=!settings.hidden;nav.querySelector('.world-settings-toggle').setAttribute('aria-expanded',String(!settings.hidden));};
nav.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(b)show(b.dataset.view);});close.onclick=closeReading;
document.addEventListener('keydown',e=>{if(e.key!=='Escape'||e.defaultPrevented)return;if(!menu.hidden){setMenu(false);nav.querySelector('.world-location-toggle').focus();return;}if(!settings.hidden){settings.hidden=true;nav.querySelector('.world-settings-toggle').focus();return;}if(!places.includes(current)){e.preventDefault();closeReading();}});
window.addEventListener('alchemy:opening-view',e=>{if(places.includes(e.detail?.view))show(e.detail.view,true);});
window.addEventListener('alchemy:order',()=>show('work',true));
window.addEventListener('alchemy:equipment',()=>current==='equipment'?closeReading():show('equipment'));
window.addEventListener('alchemy:work',()=>show('work'));
window.addEventListener('alchemy:close-reading',closeReading);
window.addEventListener('alchemy:market',()=>show('shop'));
window.addEventListener('alchemy:render',()=>{const c=window.AlchemyGame.campaign();document.getElementById('engineWallet').textContent=c?'第 '+c.day+' 天 · '+(c.economy?.coins||0)+' 铜钱':'';fit();});
window.addEventListener('resize',fit);show('work',true);
})();
