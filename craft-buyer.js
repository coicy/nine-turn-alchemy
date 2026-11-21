/* A buyer purchases existing stock; no materials, commissions, deposits or debts. */
(() => {
 'use strict';
 const api=window.AlchemyGame,C=window.AlchemyCrafts,D=window.AlchemyDialogue,UX=window.AlchemyUX;
 const board=document.querySelector('.counter-board'),visitor=document.getElementById('counterVisitor');
 const panel=document.createElement('section');panel.className='pill-bag-panel craft-trade-panel';panel.setAttribute('aria-label','来客求购成品');document.querySelector('.game-layout').append(panel);window.AlchemyViewState.register('craftTrade',panel);
 let queued=false,restored=false;
 const offer=()=>api.campaign()?.economy?.craftMarket?.offer;
 const atCounter=()=>offer()?.status==='waiting'&&['counter','trade'].includes(offer()?.phase);
 function safe(){const c=api.campaign(),s=api.snapshot();return c?.phase==='open'&&!c.activeId&&s.started&&s.pillEnded&&!s.busy&&!window.AlchemyScene2D?.busy&&!window.AlchemyScene2D?.held&&!window.AlchemyInteractionBusy;}
 function context(){const o=offer(),def=C.get(o.kind),profile=window.AlchemyCustomers.catalog.profiles.find(p=>p.id===o.customerId);return {day:api.campaign().day,orderId:'craftBuyer-D'+api.campaign().day,customerId:profile.id,visitor:profile.name,role:profile.role,buyerReason:def.reason,need:def.need,minTurn:o.minTurn};}
 function paintCounter(){const o=offer();if(!o)return;board.dataset.counterState='craft-buyer';visitor.classList.remove('is-away');const id='craftBuyer-D'+api.campaign().day;
  if(visitor.dataset.visitorKey!==id){visitor.dataset.visitorKey=id;visitor.replaceChildren(window.AlchemyCustomerView.portrait({id,customerId:o.customerId,status:'pending'}));}
  board.querySelectorAll(':scope>.visitor-dialogue').forEach(el=>el.remove());document.getElementById('counterParcels').replaceChildren();document.getElementById('counterParcelHint').hidden=true;document.getElementById('counterReceipt').hidden=true;
 }
 function interceptReception(){const o=offer();if(!o||o.status!=='waiting')return false;if(['counter','trade'].includes(o.phase))return true;if(!safe()||document.querySelector('dialog[open]'))return false;return api.economyAction('craftVisit');}
 function renderTrade(){const c=api.campaign(),o=offer();if(!c||!o)return;const def=C.get(o.kind),ctx=context(),matching=c.economy.pills.filter(p=>C.quote(c,p.id).ok);
  UX.html(panel,'<header class="pill-bag-heading"><div><h2>'+UX.esc(ctx.visitor)+' · 求购'+def.name+'</h2><p>至少 '+o.minTurn+' 转 · 市价加25% · 不提供材料</p></div><button data-craft-buyer-close>暂不出售</button></header><p>已炼成的物件才可成交，不接代炼，不收订金。</p><div class="craft-buyer-goods">'+(matching.length?matching.map(p=>{const q=C.quote(c,p.id);return '<article class="craft-offer-card">'+UX.art(p)+'<h3>'+C.name(p)+' · '+p.turn+'转</h3><p>普通出售 '+window.AlchemyEconomy.saleValue(c,p)+' 文 · 来客报价 '+q.payout+' 文</p><button data-craft-buyer-sell="'+UX.esc(p.id)+'">卖给'+UX.esc(ctx.visitor)+' · '+q.payout+' 铜钱</button></article>';}).join(''):'<p class="craft-buyer-empty">匣里暂无符合要求的成品。可暂不成交，继续接待炼丹客人。</p>')+'</div>');
 }
 function dismiss(){if(api.economyAction('craftDismiss')){window.AlchemyViewState.navigate('orders');window.dispatchEvent(new Event('alchemy:interaction'));}}
 panel.addEventListener('click',e=>{if(e.target.closest('[data-craft-buyer-close]'))dismiss();const b=e.target.closest('[data-craft-buyer-sell]');if(!b)return;const id=b.dataset.craftBuyerSell,q=C.quote(api.campaign(),id);if(!q.ok)return;UX.confirm({title:'出售造物',message:C.name(q.pill)+'将交给来客，收到 '+q.payout+' 铜钱；不发材料，不计炼丹委托。',confirmLabel:'确认出售',onConfirm:()=>{if(api.economyAction('craftSale',id)){window.AlchemyViewState.navigate('orders');window.dispatchEvent(new Event('alchemy:interaction'));}}});});
 function sync(){queued=false;const o=offer(),menu=document.getElementById('mainMenu');document.body.dataset.craftBuyer=atCounter()?'counter':'';entry.hidden=!atCounter();if(!api.snapshot().started||!menu?.hidden)return;
  if(!restored){restored=true;if(o?.status==='waiting'&&o.phase==='trade'){window.AlchemyViewState.navigate('orders',{internal:true});renderTrade();window.AlchemyViewState.navigate('craftTrade',{internal:true});return;}}
  if(!safe()||D.blocking||document.querySelector('dialog[open]'))return;
  if(window.AlchemyMerchantVisit?.busy)return;
  if(!o||o.status!=='waiting')return;
  if(o.phase==='trade'){if(window.AlchemyViewState.snapshot().current==='craftTrade')renderTrade();else dismiss();return;}
  if(atCounter()){
   window.AlchemyViewState.navigate('orders');paintCounter();if(D.pending){if(D.pending.graph==='craftBuyer')D.resumeConversation();}else D.start('craftBuyer',context());
  }else if(interceptReception())schedule();
 }
 function schedule(){if(!queued){queued=true;queueMicrotask(sync);}}
 window.AlchemyCraftBuyer={get atCounter(){return atCounter();},interceptReception,paintCounter};
 const entry=document.createElement('button');entry.type='button';entry.className='counter-conversation';entry.id='craftBuyerConversation';entry.textContent='来客求购';entry.hidden=true;entry.onclick=()=>D.pending?D.resumeConversation():D.start('craftBuyer',context());board.append(entry);
 window.addEventListener('alchemy:dialogue-ended',e=>{if(e.detail.graph!=='craftBuyer')return;if(D.flags.craftBuyerDecision==='inspect'&&api.economyAction('craftInspect')){renderTrade();window.AlchemyViewState.navigate('craftTrade');}else dismiss();schedule();});
 for(const event of ['alchemy:render','alchemy:interaction','alchemy:view-ready','alchemy:dialogue-state','alchemy:merchant-change'])window.addEventListener(event,schedule);
 new MutationObserver(schedule).observe(document.getElementById('mainMenu'),{attributes:true,attributeFilter:['hidden']});schedule();
})();
