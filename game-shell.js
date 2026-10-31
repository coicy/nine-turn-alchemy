(() => {
'use strict';
const forge=document.querySelector('.forge-panel'),layout=document.querySelector('.game-layout');if(!forge||!layout)return;
document.body.classList.add('engine-shell');
const viewport=document.createElement('div');viewport.className='engine-viewport';layout.append(viewport);viewport.append(forge);
const board=document.querySelector('.daily-board:not(.economy-board)'),shop=document.querySelector('.economy-board'),record=document.querySelector('.order-panel'),manual=document.querySelector('.side-panel');
const equipment=document.querySelector('.equipment-drawer');
const panels={orders:board,shop,equipment,record,manual};
const nav=document.createElement('nav');nav.className='engine-nav';nav.setAttribute('aria-label','丹坊功能');nav.innerHTML='<button data-view="work" aria-pressed="true">炼丹台</button><button data-view="orders" aria-pressed="false">接待柜台</button><button data-view="shop" aria-pressed="false">坊市</button><button data-view="equipment" aria-pressed="false" aria-controls="equipmentDrawer" aria-expanded="false">法器匣</button><button data-view="record" aria-pressed="false">经营簿</button><button data-view="manual" aria-pressed="false">丹纹炉谱</button><span id="engineWallet"></span>';document.querySelector('.topbar').after(nav);
const close=document.createElement('button');close.className='engine-close';close.textContent='返回炼丹台 ×';close.hidden=true;document.body.append(close);
let current='work',previous=null;
function commitShow(view){if(view!=='work'&&!panels[view])return;current=view;for(const [key,p] of Object.entries(panels)){if(!p)continue;p.classList.add('engine-panel');p.hidden=key!==view;p.dataset.shellActive=String(key===view);if(p.tagName==='DETAILS')p.open=true;}
 close.hidden=['work','equipment'].includes(view);document.body.classList.toggle('equipment-open',view==='equipment');document.querySelector('.equipped-tool-status')?.setAttribute('aria-expanded',String(view==='equipment'));document.body.classList.toggle('shop-docked',false);viewport.inert=!['work','equipment'].includes(view);viewport.style.visibility=['work','equipment'].includes(view)?'visible':'hidden';requestAnimationFrame(fit);nav.querySelectorAll('button').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.view===view));if(b.dataset.view==='equipment')b.setAttribute('aria-expanded',String(view==='equipment'));});if(view!=='work'){panels[view].setAttribute('tabindex','-1');panels[view].focus({preventScroll:true});}else if(previous){previous.focus?.({preventScroll:true});previous=null;}}
// A requested view exits the current surface, enters the destination, then restores input.
// New requests cancel both timers and always win over an earlier destination.
let exitTimer=null,enterTimer=null,requested='work',phase='idle';
const surface=view=>view==='work'?viewport:panels[view];
function cleanTransitions(){clearTimeout(exitTimer);clearTimeout(enterTimer);for(const el of [viewport,...Object.values(panels)].filter(Boolean)){el.classList.remove('view-entering','view-leaving');el.inert=false;}viewport.inert=!['work','equipment'].includes(current);}
function show(view){if(view!=='work'&&!panels[view])return;cleanTransitions();requested=view;
 if(view===current){phase='idle';document.body.dataset.viewPhase=phase;return;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 phase='leaving';document.body.dataset.viewPhase=phase;const leaving=surface(current);leaving.dataset.motionView=current;leaving.classList.add('view-leaving');leaving.inert=true;viewport.inert=true;
 exitTimer=setTimeout(()=>{cleanTransitions();commitShow(view);phase='entering';document.body.dataset.viewPhase=phase;const entering=surface(view);entering.dataset.motionView=view;entering.classList.add('view-entering');entering.inert=true;viewport.inert=true;
  enterTimer=setTimeout(()=>{cleanTransitions();phase='idle';document.body.dataset.viewPhase=phase;window.dispatchEvent(new CustomEvent('alchemy:view-ready',{detail:{view}}));},reduced?0:240);
 },reduced?0:120);
}
window.addEventListener('alchemy:opening-view',e=>{if(['work','orders'].includes(e.detail?.view))show(e.detail.view);});
window.AlchemyViewState={snapshot:()=>({current,requested,phase})};
nav.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;previous=b;show(b.dataset.view);});close.onclick=()=>show('work');document.addEventListener('keydown',e=>{if(e.key==='Escape'&&(current!=='work'||phase!=='idle'))show('work');});
function fit(){const w=viewport.clientWidth,h=viewport.clientHeight;const compact=!!forge.dataset.room&&w<1280;const changed=document.body.classList.contains('compact-forge')!==compact;document.body.classList.toggle('compact-forge',compact);if(changed)window.dispatchEvent(new Event('alchemy:layout'));const scale=Math.min(1,w/(forge.dataset.room ? (compact?1100:1600) : 660),h/Math.max(forge.offsetHeight,1));forge.style.transform='translate(-50%,-50%) scale('+scale+')';}
window.addEventListener('resize',fit);if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(forge);
window.addEventListener('alchemy:order',()=>show('work'));
window.addEventListener('alchemy:equipment',()=>{previous=document.activeElement;show(current==='equipment'?'work':'equipment');});
window.addEventListener('alchemy:work',()=>show('work'));
window.addEventListener('alchemy:market',()=>show('shop'));
window.addEventListener('alchemy:render',()=>{const c=window.AlchemyGame.campaign(),s=window.AlchemyGame.snapshot();document.getElementById('engineWallet').textContent=c?'第 '+c.day+' 天 · '+(c.economy?.coins||0)+' 铜钱':'';if(s.runeChoices?.length&&current!=='work')commitShow('work');requestAnimationFrame(fit);});
commitShow('work');requestAnimationFrame(fit);
})();

