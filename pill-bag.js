(() => {
 const api=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,panel=document.createElement('section');panel.className='pill-bag-panel';panel.setAttribute('aria-labelledby','pillBagTitle');panel.innerHTML='<header class="pill-bag-heading"><div><h2 id="pillBagTitle">丹匣</h2><p id="pillBagCount"></p></div><button data-bag-return data-focus-key="close-bag">合上丹匣</button></header><p id="pillBagStatus" role="status"></p><p id="pillBagLeaseOffer" class="pill-bag-lease-offer" hidden></p><div id="pillBagList" tabindex="-1"></div><section id="pillBagSelected" aria-label="选中丹药详情"></section>';document.querySelector('.game-layout').append(panel);
 let selected=null,vacancy=null;const nature={warm:'温性',cool:'寒性',neutral:'平性'},quality=['凡品','良品','上品','极品','绝品'];
 const lease=window.AlchemyLease;
 const offerNote=panel.querySelector('#pillBagLeaseOffer');
 function updateLeaseOffer(c) {
   const fromLease=window.AlchemyViewState?.snapshot().context?.objectId==='lease-purchase';
   panel.classList.toggle('lease-purchase-view',fromLease);
   if (fromLease || matchMedia("(max-width: 360px)").matches) {
     const nav=document.querySelector('.engine-nav');
     panel.style.setProperty('--lease-bag-top',Math.ceil(nav.getBoundingClientRect().bottom+8)+'px');
   }
   offerNote.hidden=!c || !fromLease || !lease.canOffer(c);
   if (!offerNote.hidden) {
     UX.html(offerNote,UX.art({turn:lease.procurement.featuredTurn,quality:1,nature:'warm',appearance:'lead-red'})+'药铺采购 · 第 '+lease.procurement.lastDay+' 天收工前交付一颗药力至少 '+lease.procurement.minimum+' 的丹，按售价加 '+lease.procurement.premium+' 文；九转及以上加 '+lease.procurement.featuredPremium+' 文。限购一颗。');
   }
 }
 function render(){const c=api.campaign();if(!c){panel.hidden=true;return;}const e=E.ensure(c),s=api.snapshot(),list=panel.querySelector('#pillBagList'),detail=panel.querySelector('#pillBagSelected');if(!Array.isArray(e.pills)){panel.querySelector('#pillBagCount').textContent='记录异常，原数据已保留';return;}panel.querySelector('#pillBagCount').textContent=e.pills.length?e.pills.length+' 颗':'';
  updateLeaseOffer(c);
  if(!e.pills.some(p=>p.id===selected))selected=null;
  const cards=e.pills.map(p=>'<button class="pill-bag-card quality-'+p.quality+'" data-pill-id="'+p.id+'" aria-pressed="'+(selected===p.id)+'" aria-label="查看'+p.turn+'转'+quality[p.quality]+nature[p.nature]+'灵丹，药力'+Math.round(p.value)+'">'+UX.art(p)+'<span>'+p.turn+'转 · '+quality[p.quality]+'</span>'+'</button>');
  if(vacancy)cards.splice(Math.min(vacancy.index,cards.length),0,'<div tabindex="-1" class="pill-bag-card empty-pill-place" data-focus-key="sold-place" aria-label="刚售出丹药的空丹位">空位</div>');
  const occupied=cards.length;while(cards.length<Math.max(6,Math.ceil(occupied/3)*3))cards.push('<div class="pill-bag-place" aria-hidden="true"></div>');UX.html(list,(occupied?'':'<p class="pill-bag-empty">丹匣尚空</p>')+cards.join(''));
  const p=e.pills.find(p=>p.id===selected);detail.hidden=!p;if(!p){detail.replaceChildren();return;}
  const preview=UX.submissionSummary(api.previewSubmission(p.id));
  const purchase=lease.purchaseQuote(c,p.id);
  const blocked=s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held;
  const purchaseAction=purchase?'<button type="button" class="pill-bag-action pill-bag-lease-purchase" data-lease-purchase="'+UX.esc(p.id)+'" '+(blocked?'disabled':'')+'>药铺收购 · '+purchase.payout+' 铜钱</button>':'';
  UX.html(detail,UX.art(p)+'<h3>'+p.turn+'转 · '+quality[p.quality]+'灵丹</h3><p>'+nature[p.nature]+' · 药力 '+Math.round(p.value)+' · 第 '+p.day+' 天收丹</p>'
   +(p.materialAdvance?'<p>交易报价已抵客料款，最多24文。</p>':'')+(preview?'<p class="pill-bag-submit-preview">'+preview+'</p>':'')+'<div class="pill-bag-detail-actions" aria-label="丹药处理动作">'
   +(preview?'<button data-submit-pill="'+p.id+'" '+(s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||window.AlchemyScene2D?.held?'disabled':'')+'>提交委托</button>':'')
   +'<button data-sell-pill="'+p.id+'" '+(s.busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy?'disabled':'')+'>出售 · '+E.saleValue(c,p)+' 铜钱</button>'+purchaseAction+'</div>');
 }
 panel.addEventListener('click',e=>{if(e.target.closest('[data-bag-return]')){window.AlchemyViewState.close();return;}const pick=e.target.closest('[data-pill-id]');if(pick){
  selected=pick.dataset.pillId;
  render();
  requestAnimationFrame(()=>UX.revealSubmission(panel,panel.querySelector('.pill-bag-submit-preview'),panel.querySelector('[data-submit-pill]')));
  return;
 }const submit=e.target.closest('[data-submit-pill]');if(submit&&!submit.disabled){const id=submit.dataset.submitPill;selected=null;if(!api.submit(id))selected=id;render();return;}const sell=e.target.closest('[data-sell-pill]'),purchase=e.target.closest('[data-lease-purchase]'),trade=sell||purchase;if(trade&&!trade.disabled){const id=trade.dataset.sellPill||trade.dataset.leasePurchase,pills=api.campaign().economy.pills,index=pills.findIndex(p=>p.id===id),ok=api.economyAction(sell?'sell':'leasePurchase',id);if(ok){selected=null;vacancy={index};render();panel.querySelector('[data-focus-key="sold-place"]')?.focus({preventScroll:true});}UX.notify(panel.querySelector('#pillBagStatus'),ok?api.campaign().economy.last:'交易未完成，请重新选择丹药。');}});
 window.addEventListener('resize', () => {
   if (panel.classList.contains('lease-purchase-view')) requestAnimationFrame(()=>updateLeaseOffer(api.campaign()));
 });
 window.addEventListener('alchemy:view-ready', event => {
   if (event.detail.view === 'bag') {
     updateLeaseOffer(api.campaign());
   } else if (!window.AlchemyViewState.snapshot().stack.includes('bag')) {
     selected = null;
     vacancy = null;
     panel.querySelector('#pillBagStatus').textContent = '';
     render();
   }
 });window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
