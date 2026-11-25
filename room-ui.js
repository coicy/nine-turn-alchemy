(() => {
 const api=window.AlchemyGame,UX=window.AlchemyUX,forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');document.body.classList.add('painted-room');forge.dataset.room='true';
 stage.insertAdjacentHTML('beforeend','<section class="room-observation" aria-label="炉中丹药"><h2>炉中丹药</h2><div id="roomFacts"></div><small></small></section><p class="room-empty" id="roomEmpty" hidden></p><section id="roomSettlement" class="room-loop-card" hidden aria-live="polite"></section>');
 const fire=document.getElementById('fireObject');fire.insertAdjacentHTML('afterbegin','<img class="room-tool" src="'+(window.AlchemyWarmProps?.props.fan.src||'assets/runtime/alchemy-fan-v1.webp')+'" alt="" draggable="false">');document.querySelector('.tray-object b').textContent='收丹盘';
 const decision=document.createElement('p');decision.id='roomDecision';const stock=document.createElement('p');stock.id='roomStock';document.querySelector('.room-observation').append(decision,stock);
 let receiptKey='',dismissedReceipt='';
 const receiptId=s=>[s.orderId,s.attempt,s.endReason,s.collected.length].join(':');
 function dismissReceipt(){dismissedReceipt=receiptId(api.snapshot());settlement.hidden=true;}
 const settlement=document.getElementById('roomSettlement');

 settlement.addEventListener('click',e=>{if(e.target.closest('button'))dismissReceipt();if(e.target.closest('[data-furnace-room]')){window.AlchemyFurnaceView.returnToRoom();return;}if(e.target.closest('#settlementReserveStart')){window.AlchemyViewState.navigate('work',{workMode:'room'});window.dispatchEvent(new Event('alchemy:reserve-select'));return;}const b=e.target.closest('[data-destination]');if(b){if(b.dataset.destination==='supply')window.AlchemyMerchantVisit.call();else window.AlchemyViewState.navigate(b.dataset.destination);}});
 function update(){const s=api.snapshot(),c=api.campaign(),E=window.AlchemyEconomy,live=s.started&&!s.pillEnded&&!s.roundEnded;


  const view=window.AlchemyViewState.snapshot(),furnaceEnd=view.workMode==='furnace'&&s.started&&s.pillEnded&&['collect','explode'].includes(s.endReason);
  settlement.hidden=true;
  const key=[receiptId(s),s.roundEnded,c?.economy?.stock.join(','),Object.values(c?.economy?.herbs||{}).join(','),c?.economy?.pills?.length].join(':');
  if(!settlement.hidden&&key!==receiptKey){receiptKey=key;const o=s.order,hasMaterials=c.phase==='open'&&((c.economy.stock||[]).some(n=>n>0)||Object.values(c.economy.herbs||{}).some(n=>n>0)),pending=c.orders.some(o=>o.status==='pending'),success=s.endReason==='collect';
   if(!s.roundEnded){UX.html(settlement,'<header class="receipt-heading"><h2>'+(s.endReason==='collect'?'本炉已交丹':'本炉炸丹')+'</h2><span aria-hidden="true">'+(s.endReason==='collect'?'收':'止')+'</span></header><div class="receipt-details"><p>本单累计 '+Math.round(s.delivered)+' / '+s.target+' · 余客料 '+s.remaining+' 包</p></div><div class="receipt-actions"><button data-furnace-room data-primary data-focus-key="furnace-restock">回丹房取料</button></div>');}
   else {const summary=o?(o.status==='completed'?'委托完成 · 收入 '+(o.reward||0)+' 铜钱'+(o.gifted?' · 赠药 '+o.gifted+' 包':''):'委托结束 · 余料已退'):(success?'丹药已入丹匣 · '+s.turn+'转 · 药力 '+Math.round(s.value):'本炉炸丹 · 未成丹');
   const primary=o?'orders':(hasMaterials?'reserve':success&&c.economy.pills.length?'bag':'supply');
   UX.html(settlement,'<header class="receipt-heading"><h2>'+(o?'委托结契':'本炉凭据')+'</h2><span aria-hidden="true">结</span></header><div class="receipt-details"><p>'+UX.esc(o?window.AlchemyCustomers.settlement(o):summary)+'</p></div>'+'<div class="receipt-actions">'+(pending?'':'<button data-destination="orders">回柜台收工</button>')+'<button id="settlementReserveStart" '+(!hasMaterials?'hidden':'')+' '+(primary==='reserve'?'data-primary':'')+'>使用储备药材</button><button data-destination="bag" '+(!o&&!success?'':'hidden')+' '+(primary==='bag'?'data-primary':'')+'>打开丹匣</button><button data-destination="supply" '+(hasMaterials?'hidden':'')+' '+(primary==='supply'?'data-primary':'')+'>请何采药送药</button></div>');
   const buttons=settlement.querySelector('.receipt-actions');const main=buttons.querySelector('[data-primary]');if(main)buttons.prepend(main);}
  }
  decision.textContent=live?(s.order?`收丹入匣后提交 ${Math.round(s.delivered+s.value)} / ${s.target} · ${s.delivered+s.value>=s.target?'可结单':'尚差 '+Math.ceil(s.target-s.delivered-s.value)}`:'收丹入匣 · 售价估计 '+E.saleValue(c,s)+' 铜钱'):'';
  stock.textContent=live&&s.order?`已交 ${Math.round(s.delivered)} · 本单余料 ${s.remaining} 包`:'';stock.hidden=!stock.textContent;
  document.body.classList.toggle('info-live',live);document.body.classList.toggle('info-ended',s.roundEnded);stage.dataset.live=String(live);stage.dataset.loading=String(!!s.busy);document.querySelector('.room-observation').hidden=!live;
  for(const id of ['herbObject','trayObject','trayPills','deliverySeals','roomEmpty'])document.getElementById(id).hidden=true;fire.hidden=!live;
  const facts=document.getElementById('roomFacts');facts.replaceChildren();if(live)for(const [label,value]of[['转数',s.turn+'转'],['品质',document.getElementById('qualityValue').textContent],['当前药力',Math.round(s.value)],['炸丹概率',(api.refinementProbabilities().outcomes.explode*100).toFixed(1)+'%']]){const row=document.createElement('div');row.dataset.fact=label;row.innerHTML='<span>'+label+'</span><strong>'+value+'</strong>';facts.append(row);}
  document.getElementById('fireLabel').textContent=s.busy?'炼化中':'炼化';document.getElementById('fireHint').textContent='点火门扇火';document.getElementById('trayHint').textContent=s.order?'计入本单':'收入丹匣';document.querySelector('.commission-slip').hidden=live||!s.order||s.roundEnded;document.getElementById('toolTriggerStatus').hidden=true;document.getElementById('valueChange').hidden=true;
 }
 window.addEventListener('alchemy:furnace-leave',dismissReceipt);window.addEventListener('alchemy:view-ready',e=>{if(e.detail.location!=='work'||(e.detail.view!=='work'&&e.detail.workMode!=='furnace'))dismissReceipt();update();});window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:order',update);update();
})();
