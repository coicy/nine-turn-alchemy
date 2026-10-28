(() => {
'use strict';
const forge=document.querySelector('.forge-panel'),layout=document.querySelector('.game-layout');if(!forge||!layout)return;
document.body.classList.add('engine-shell');
const viewport=document.createElement('div');viewport.className='engine-viewport';layout.append(viewport);viewport.append(forge);
const board=document.querySelector('.daily-board:not(.economy-board)'),shop=document.querySelector('.economy-board'),record=document.querySelector('.order-panel'),manual=document.querySelector('.side-panel');
const panels={orders:board,shop,record,manual};
const nav=document.createElement('nav');nav.className='engine-nav';nav.setAttribute('aria-label','丹坊功能');nav.innerHTML='<button data-view="work" aria-pressed="true">炼丹台</button><button data-view="orders" aria-pressed="false">委托簿</button><button data-view="shop" aria-pressed="false">坊市与器具</button><button data-view="record" aria-pressed="false">本单记录</button><button data-view="manual" aria-pressed="false">丹纹炉谱</button><span id="engineWallet"></span>';document.querySelector('.topbar').after(nav);
const shade=document.createElement('div');shade.className='engine-shade';shade.hidden=true;document.body.append(shade);
const close=document.createElement('button');close.className='engine-close';close.textContent='返回炼丹台 ×';close.hidden=true;document.body.append(close);
let current='work',previous=null;
function show(view){if(view!=='work'&&!panels[view])return;current=view;for(const [key,p] of Object.entries(panels)){if(!p)continue;p.classList.add('engine-panel');p.hidden=key!==view;if(p.tagName==='DETAILS')p.open=true;}
 shade.hidden=view==='work';close.hidden=view==='work';viewport.inert=view!=='work';nav.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===view)));if(view!=='work'){panels[view].setAttribute('tabindex','-1');panels[view].focus({preventScroll:true});}else if(previous){previous.focus?.({preventScroll:true});previous=null;}}
nav.addEventListener('click',e=>{const b=e.target.closest('[data-view]');if(!b)return;previous=b;show(b.dataset.view);});shade.onclick=()=>show('work');close.onclick=()=>show('work');document.addEventListener('keydown',e=>{if(e.key==='Escape'&&current!=='work')show('work');});
function fit(){const w=viewport.clientWidth,h=viewport.clientHeight;const scale=Math.min(1,w/660,h/Math.max(forge.offsetHeight,1));forge.style.transform='translate(-50%,-50%) scale('+scale+')';}
window.addEventListener('resize',fit);if(typeof ResizeObserver!=='undefined')new ResizeObserver(fit).observe(forge);
window.addEventListener('alchemy:order',()=>show('work'));
window.addEventListener('alchemy:render',()=>{const c=window.AlchemyGame.campaign(),s=window.AlchemyGame.snapshot();document.getElementById('engineWallet').textContent=c?'第 '+c.day+' 天 · '+(c.economy?.coins||0)+' 铜钱':'';if(s.runeChoices?.length&&current!=='shop')show('shop');requestAnimationFrame(fit);});
show('work');requestAnimationFrame(fit);
})();
