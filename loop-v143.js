/* Inventory, furnace and commission are independent. UI never settles a viewed pill. */
(() => {
 'use strict';
 const game=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,route=window.AlchemyViewState;
 const stock=document.querySelector('.herb-tray'),viewport=document.querySelector('.engine-viewport');
 document.body.classList.add('loop-v143');
 const selection=document.createElement('section');selection.className='loop-selection';selection.setAttribute('aria-label','选中丹药');selection.hidden=true;stock.append(selection);
 const next=document.createElement('div');next.className='loop-next';stock.append(next);
 const back=document.createElement('button');back.type='button';back.className='loop-return';back.textContent='放回';back.setAttribute('aria-keyshortcuts','Escape');back.hidden=true;viewport.append(back);
 const letter=document.createElement('section');letter.className='loop-letter journal-book';letter.setAttribute('aria-label','当前委托来笺');document.querySelector('.game-layout').append(letter);route.register('demand',letter);
 let selected=null,queued=false,origin=null,notice='',noticeUntil=0,noticeTimer;
 function html(el,s){if(el.innerHTML!==s)UX.html(el,s);}
 function busy(s){return s.busy||window.AlchemyScene2D.busy||!!window.AlchemyScene2D.held||!!window.AlchemyInteractionBusy;}
 function nextCustomer(){const c=game.campaign();if(!c||c.orders.some(o=>o.status==='active'))return;window.dispatchEvent(new Event('alchemy:next-customer'));route.navigate('orders');}
 function terminate(){UX.confirm({title:'终止本单',message:'未用本单料退还，本单记为未完成。库存丹药保留，免赔。',confirmLabel:'终止并退还',onConfirm:()=>game.abandonOrder()});}
 function openDemand(anchor){const s=game.snapshot();if(!s.commission)return;renderLetter();route.navigate('demand',{anchor});}
 function renderLetter(){const s=game.snapshot(),o=s.commission;if(!o)return;html(letter,'<header class="journal-heading"><h2>'+UX.esc(o.name)+'</h2><button data-close-demand>合上 ×</button></header><div class="loop-letter-body"><p>'+UX.esc(o.client)+' · 来客手书</p><dl><dt>所求丹值</dt><dd>'+o.target+'</dd><dt>已交丹值</dt><dd>'+Math.round(s.delivered)+'</dd><dt>还需</dt><dd>'+Math.max(0,Math.ceil(o.target-s.delivered))+'</dd><dt>本单余料</dt><dd>'+s.remaining+' 包</dd><dt>约定工钱</dt><dd>'+E.fee(o)+' 铜钱，另计加赏</dd></dl><p>选中库存丹，明确提交后累计；达标结单。未成免赔，成功后未用材料赠留。</p><p>丹药可自行保留或出售。收丹、选中与查看均不代表交付。</p></div>');}
 letter.addEventListener('click',e=>{if(e.target.closest('[data-close-demand]'))route.close();});
 function showNotice(text){notice=text;noticeUntil=performance.now()+1600;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice='';schedule();},1600);}
 function trade(kind,id){const p=game.campaign()?.economy.pills.find(p=>p.id===id);if(!p)return;selected=null;const ok=kind==='submit'?game.submit(id):game.economyAction('sell',id);if(!ok){selected=id;showNotice('未处理，请重新查看。');}else{const s=game.snapshot();showNotice(kind==='submit'?(s.commission?'已提交':'委托已成'):'已出售');}schedule();}
 stock.addEventListener('click',e=>{
  const card=e.target.closest('[data-stock-pill]'),sell=e.target.closest('[data-loop-sell]'),submit=e.target.closest('[data-loop-submit]'),inspect=e.target.closest('[data-loop-inspect]'),clear=e.target.closest('[data-loop-clear]');
  if(!card&&!sell&&!submit&&!inspect&&!clear)return;e.preventDefault();e.stopImmediatePropagation();const s=game.snapshot();if(busy(s)){UX.tell('先处理或放回手中物件。');return;}
  if(card){selected=card.dataset.stockPill;notice='';}else if(clear)selected=null;else if(submit)trade('submit',submit.dataset.loopSubmit);else if(sell)trade('sell',sell.dataset.loopSell);else if(inspect){if(route.navigate('bag',{anchor:inspect}))requestAnimationFrame(()=>document.querySelector('.pill-bag-card[data-pill-id="'+CSS.escape(selected)+'"]')?.click());}schedule();
 },true);
 next.addEventListener('click',e=>{if(e.target.closest('[data-loop-next]'))nextCustomer();if(e.target.closest('[data-loop-stop]'))terminate();if(e.target.closest('[data-loop-market]'))route.navigate('shop');});
 back.onclick=()=>{window.AlchemyScene2D.cancel();UX.clearInstruction();schedule();if(origin?.isConnected&&origin.checkVisibility())origin.focus({preventScroll:true});};
 function render(){
  queued=false;const s=game.snapshot(),c=game.campaign(),v=route.snapshot();if(!c)return;const atWork=v.current==='work'&&!window.AlchemyOpening?.active,pills=c.economy.pills;
  if(!Array.isArray(pills))return;const p=pills.find(p=>p.id===selected);if(!p)selected=null;
  // A material repaint may not remove these independent controls.
  if(!stock.contains(selection))stock.append(selection);if(!stock.contains(next))stock.append(next);
  document.getElementById('roomSettlement').hidden=true;document.getElementById('roomChoices').hidden=true;
  stock.dataset.sceneVisible=String(atWork);const stockTitle=stock.querySelector('.scene-stock-nav strong');if(stockTitle){stockTitle.textContent=notice&&performance.now()<noticeUntil?notice:'丹料';stockTitle.setAttribute('role','status');}const demand=document.querySelector('.scene-demand');demand.hidden=!s.commission||v.location!=='work';
  stock.querySelectorAll('[data-stock-pill]').forEach(el=>{el.setAttribute('aria-pressed',String(el.dataset.stockPill===selected));el.setAttribute('aria-label','选中丹药，丹值'+(pills.find(p=>p.id===el.dataset.stockPill)?.value||''));});
  const locked=busy(s),disabled=locked?' disabled':'',q=p&&game.previewSubmission(p.id);
  selection.hidden=!p;
  if(p){const preview=q.ok?'提交后 '+Math.round(q.after)+' / '+q.target+(q.complete?' · 结单 '+q.reward+' 铜钱':''):'';html(selection,'<div class="loop-selected-heading"><strong>'+p.turn+'转 · 丹值 '+Math.round(p.value)+'</strong><button data-loop-inspect aria-label="查看选中丹药">看丹</button><button data-loop-clear aria-label="取消选中丹药">×</button></div>'+(preview?'<p class="loop-preview">'+preview+'</p>':'')+'<div class="loop-trades">'+(q.ok?'<button data-loop-submit="'+UX.esc(p.id)+'"'+disabled+'>提交</button>':'')+'<button data-loop-sell="'+UX.esc(p.id)+'"'+disabled+'>出售 · '+E.saleValue(c,p)+' 铜钱</button></div>');}
  else html(selection,notice?'<p class="loop-notice" role="status">'+UX.esc(notice)+'</p>':'');
  const pending=c.orders.some(o=>o.status==='pending');let footer='';if(c.phase==='open'&&!s.commission){footer='<button data-loop-next'+(locked?' disabled':'')+'>'+(pending?'接待下一位':'回柜台收工')+'</button>';if(!s.order||s.order.status!=='active')footer+=(c.economy.stock.some(n=>n>0)||Object.values(c.economy.herbs).some(n=>n>0))?'':'<button data-loop-market'+disabled+'>购置药材</button>';}
  else if(s.commission&&s.pillEnded&&s.remaining===0)footer='<span>本单料已尽 · 还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'</span><button data-loop-stop'+disabled+'>终止本单</button>';
  html(next,footer);next.hidden=!footer;
  back.hidden=!atWork||!['herbs','pill'].includes(window.AlchemyScene2D.held);if(!back.hidden){const sr=stock.getBoundingClientRect(),vr=viewport.getBoundingClientRect();back.style.left=Math.max(8,Math.min(vr.width-80,sr.left-vr.left+8))+'px';back.style.top=Math.max(8,sr.top-vr.top-52)+'px';}
  if(v.current==='demand'){renderLetter();document.querySelector('.engine-close').hidden=true;}
  window.AlchemyWorldLayout.fit();const amount=document.querySelector('.furnace-facts b');if(amount?.checkVisibility()){const natural=amount.scrollWidth,available=Math.min(amount.clientWidth,amount.parentElement.clientWidth);if(natural>available&&available>0)amount.style.setProperty('font-size',Math.max(12,parseFloat(getComputedStyle(amount).fontSize)*available/natural*.96)+'px','important');}
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}
 window.addEventListener('alchemy:pill-stored',e=>{selected=e.detail.id;notice='';schedule();requestAnimationFrame(()=>requestAnimationFrame(()=>{const b=stock.querySelector('[data-stock-pill="'+CSS.escape(selected||'')+'"]');if(b?.checkVisibility()&&route.snapshot().current==='work'){b.scrollIntoView({block:'nearest',inline:'nearest'});b.focus({preventScroll:true});}}));});
 window.addEventListener('alchemy:inventory-action',e=>{if(selected===e.detail.id)selected=null;schedule();});
 window.addEventListener('alchemy:carry',e=>{if(e.detail.kind)origin=document.activeElement;schedule();});
 for(const e of ['alchemy:render','alchemy:interaction','alchemy:ux-layout','alchemy:view-ready','alchemy:world-layout','alchemy:opening-finished','resize'])window.addEventListener(e,schedule);
 window.AlchemyLoop={openDemand,nextCustomer,get selected(){return selected;},version:143};schedule();
})();
