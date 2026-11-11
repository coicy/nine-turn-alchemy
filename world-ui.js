/* Object affordances and short reading surfaces; business state stays in AlchemyGame. */
(() => {
'use strict';
const api=window.AlchemyGame,E=window.AlchemyEconomy,stage=document.getElementById('pillStage'),viewport=document.querySelector('.engine-viewport'),observation=document.querySelector('.room-observation');
const readout=document.createElement('section');readout.className='world-readout';readout.setAttribute('aria-label','本炉判断');viewport.append(readout);
const emptyReadout=document.createElement('section');emptyReadout.className='world-empty-readout';emptyReadout.hidden=true;emptyReadout.setAttribute('aria-label','当前备料');viewport.append(emptyReadout);
for(const selector of ['#roomFacts','#roomDecision','#roomStock']){const el=observation.querySelector(selector);if(el)readout.append(el);}observation.querySelector('h2').textContent='炉胆 · 局部剖视';
const caption=document.createElement('span');caption.className='world-section-caption';caption.textContent='';caption.hidden=true;observation.append(caption);
const row=document.createElement('div');row.className='world-tool-row';row.setAttribute('aria-label','案后法器');stage.append(row);
const bag=document.createElement('button');bag.className='world-casket';bag.setAttribute('aria-label','打开丹药背包');bag.innerHTML='<img src="assets/object-world-v86/casket.webp" alt=""><span>丹匣</span><small></small>';bag.onclick=()=>window.AlchemyViewState.navigate('bag');stage.append(bag);
const seal=document.createElement('div');seal.className='world-delivery-seals';seal.setAttribute('aria-label','本单交付凭据');stage.append(seal);
const books=document.createElement('div');books.className='world-books';books.innerHTML='<button data-world-view="record">经营簿</button><button data-world-view="manual">炉谱</button>';stage.append(books);
const bookRest=document.createElement('div');bookRest.className='world-book-rest';bookRest.setAttribute('aria-hidden','true');bookRest.innerHTML='<i class="rest-post"></i><i class="rest-brace"></i><i class="rest-stud rest-stud-top"></i><i class="rest-stud rest-stud-bottom"></i>';stage.append(bookRest);
const portals=[];
function portal(host,label,view,cls){const b=document.createElement('button');b.className='world-passage '+cls;b.dataset.worldView=view;b.textContent=label;b.setAttribute('aria-label',label);host.append(b);portals.push(b);return b;}
portal(stage,'前堂 ›','orders','passage-counter');
const counter=document.querySelector('.counter-board'),market=document.querySelector('.economy-board');
const counterPortal=portal(counter,'回炉 ›','work','passage-forge');const marketPortal=portal(counter,'去坊市 ›','shop','passage-market');
// The rear courtyard is a fixed-view route; its wooden portal remains distinct from stock.
const visitor=document.getElementById('counterVisitor');function syncBubble(){const bubble=visitor.querySelector('.visitor-dialogue');if(!bubble){if(visitor.classList.contains('is-away'))counter.querySelectorAll(':scope > .visitor-dialogue').forEach(el=>el.remove());return;}counter.querySelectorAll(':scope > .visitor-dialogue').forEach(el=>el.remove());counter.append(bubble);}new MutationObserver(syncBubble).observe(visitor,{childList:true});syncBubble();
const back=portal(market,'回丹坊 ›','work','passage-home');let lastHome='work';
for(const host of [counter,market]){const b=document.createElement('div');b.className='world-books';b.innerHTML='<button data-world-view="record">经营簿</button><button data-world-view="manual">炉谱</button>';host.append(b);}
let marketBooks=null;
// Market content re-renders. Reattach stable world objects without replacing their handlers.
new MutationObserver(()=>{if(!market.contains(back))market.append(back);if(marketBooks&&!market.contains(marketBooks))market.append(marketBooks);}).observe(market,{childList:true});
document.addEventListener('click',e=>{const b=e.target.closest('[data-world-view]');if(!b)return;const view=b===back?lastHome:b.dataset.worldView;window.AlchemyViewState.navigate(view,{anchor:b});});
marketBooks=market.querySelector('.world-books');
const bell=document.getElementById('settleDay');bell.classList.add('world-day-bell');bell.innerHTML='<span aria-hidden="true">♧</span><span>收市铃 · 结束今日</span>';
const settings=document.getElementById('worldSettings');for(const el of [...document.querySelector('.engine-nav').children])if(!el.matches('.world-location-toggle,#worldLocationMenu,.world-catalog-toggle,#worldCatalogMenu,#engineWallet,.world-settings-toggle,#worldSettings'))settings.append(el);
let placements=[null,null,null],triggerKey='',lastBagCount=0;
function decorateTools(root){root.querySelectorAll('[data-tool-art]').forEach(el=>{const index=E.TOOL_DEFS.findIndex(t=>t.id===el.dataset.toolArt);if(index<0)return;el.classList.add('tool-art');el.style.backgroundPosition=`${index%6*20}% ${Math.floor(index/6)*50}%`;el.setAttribute('aria-hidden','true');});}
function syncPlaces(ids){placements=placements.map(id=>ids.includes(id)?id:null);for(const id of ids)if(!placements.includes(id)){const i=placements.indexOf(null);if(i>=0)placements[i]=id;}}
function update(){const s=api.snapshot(),c=api.campaign();if(!c)return;stage.dataset.worldOrderSource=s.order?.self?'self':'commission';const e=E.ensure(c),ids=E.equippedIds(e.equipped),oldFocus=document.activeElement?.dataset?.worldTool;
 syncPlaces(ids);row.replaceChildren();placements.forEach((id,i)=>{const tool=E.TOOL_DEFS.find(t=>t.id===id),b=document.createElement('button');b.dataset.worldTool=id||'empty-'+i;b.className='world-placed-tool '+(id&&/needle|guide/.test(id)?'tool-needle':id&&/mirror|fusion|six|stone/.test(id)?'tool-stand':'tool-cushion');b.setAttribute('aria-label',tool?'查看'+tool.name:'布置法器');b.innerHTML=(tool?'<span data-tool-art="'+id+'"></span><small>'+tool.name+'</small>':'<span class="world-empty-rest"></span><small>布置</small>');b.onclick=()=>window.AlchemyEquipmentView.inspect(id,b);row.append(b);});decorateTools(row);
 if(oldFocus)row.querySelector('[data-world-tool="'+oldFocus+'"]')?.focus({preventScroll:true});
 const count=e.pills?.length||0;bag.querySelector('span').textContent=count?'丹匣 · '+count:'丹匣';bag.querySelector('small').textContent='';bag.setAttribute('aria-label','打开丹匣，共'+count+'颗');bag.dataset.filled=String(count>0);lastBagCount=count;
 seal.textContent=s.order&&!s.order.self&&s.collected.length?'已交 '+s.collected.length+' 丹 · '+Math.round(s.delivered)+' 丹值':'';
 readout.hidden=!s.started||s.pillEnded||s.roundEnded;readout.dataset.live=String(!s.pillEnded&&!s.roundEnded);
 emptyReadout.hidden=!s.started||!s.pillEnded||s.roundEnded||!s.order;
 if(!emptyReadout.hidden){emptyReadout.replaceChildren();const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=s.order.self?'自炼备料':s.order.name+' · 已接';detail.textContent=s.order.self?'自有药材 · 收丹入匣':`客料 ${s.remaining} 包 · 已交 ${Math.round(s.delivered)} / ${s.target}`;emptyReadout.append(title,detail);}
 const key=s.orderId+':'+s.attempt+':'+s.turn+':'+s.toolProgress.triggers.join('|');
 if(triggerKey&&key!==triggerKey&&s.toolProgress.triggers.length){for(const t of E.TOOL_DEFS)if(s.toolProgress.triggers.some(text=>text.includes(t.name))){const b=row.querySelector('[data-world-tool="'+t.id+'"]');if(b&&!matchMedia('(prefers-reduced-motion: reduce)').matches)b.animate([{filter:'brightness(1)'},{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:240});}}
 triggerKey=key;window.AlchemyWorldLayout.fit();
}
function fitReading(){window.AlchemyWorldLayout.fit();const s=api.snapshot(),atWork=window.AlchemyViewState.snapshot().location==='work';document.body.classList.toggle('info-at-work',atWork);document.body.classList.toggle('info-choosing',!!s.runeChoices?.length);for(const selector of ['#roomSettlement','#roomChoices','#workInstruction','#refineFeedback','.herb-tray']){if(selector==='.herb-tray'&&window.AlchemySceneContinuity)continue;const el=document.querySelector(selector);if(el&&el.parentElement!==stage)stage.append(el);el?.classList.remove('mobile-info');}observation.classList.remove('mobile-info');if(observation.parentElement!==stage)stage.append(observation);const hint=document.getElementById('workInstruction');hint.hidden=!hint.textContent.trim()||(s.roundEnded&&!window.AlchemyScene2D?.held);}
window.AlchemyWorldUI={decorateTools,fitReading};
window.addEventListener('alchemy:equipment-replaced',e=>{const i=placements.indexOf(e.detail.oldId);if(i>=0)placements[i]=e.detail.newId;update();});
window.addEventListener('alchemy:view-ready',e=>{if(['work','orders'].includes(e.detail.location))lastHome=e.detail.location;fitReading();});
window.addEventListener('alchemy:order',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelector('.herb-tray')?.animate([{filter:'brightness(1)'},{filter:'brightness(1.4)'},{filter:'brightness(1)'}],{duration:400});});
window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:world-layout',fitReading);
window.addEventListener('alchemy:world-collect',e=>{const el=e.detail.self?bag:seal;if(!matchMedia('(prefers-reduced-motion: reduce)').matches)el.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:400});});
window.addEventListener('alchemy:refine-result',e=>{stage.dataset.worldResult=e.detail.outcome;setTimeout(()=>{stage.dataset.worldResult='';},700);});
window.addEventListener('alchemy:carry',e=>{document.body.dataset.worldCarry=e.detail.kind||'';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&window.AlchemyScene2D.held){e.preventDefault();window.AlchemyScene2D.cancel();return;}const details=observation.querySelector('details[open]');if(e.key==='Escape'&&details){e.preventDefault();details.open=false;details.querySelector('summary').focus();}});
// Bag/market content may have been built before the decorator existed.
decorateTools(document);fitReading();update();
})();
