/* Reception arbitrates between selling visitors, craft buyers and the next commission. */
(() => {
  'use strict';
  const api=window.AlchemyGame, route=window.AlchemyViewState, D=window.AlchemyDialogue, trade=window.AlchemyCounterTrade;
  const board=document.querySelector('.counter-board'), visitor=document.getElementById('counterVisitor');
  const services=document.createElement('div'); services.id='counterServices';
  services.innerHTML='<button type="button" data-seller-recall></button><button type="button" data-seller-call>请何采药送药</button>';
  board.append(services);
  const callButton=services.querySelector('[data-seller-call]'), recallButton=services.querySelector('[data-seller-recall]');
  const menu=document.getElementById('mainMenu');
  let queued=false,restored=false,equipShown=false;
  const active=()=>api.campaign()?.sellers?.active;
  function free() {
    const s=api.snapshot();
    return s.started && s.pillEnded && !s.busy && !window.AlchemyScene2D?.busy && !window.AlchemyScene2D?.held && !window.AlchemyInteractionBusy && !D.blocking && !document.querySelector('dialog[open]') && !window.AlchemyCraftBuyer?.atCounter;
  }
  function paintCounter() {
    const a=active();if (!a) return;
    board.dataset.counterState='merchant';
    const seller=trade.merchants[a.seller];
    if (visitor.dataset.visitorKey!=='seller-'+a.seller) {
      visitor.dataset.visitorKey='seller-'+a.seller;visitor.classList.remove('is-away');
      const person=document.createElement('div');person.className='visitor-portrait';person.dataset.artLayout='native-v61';person.setAttribute('role','img');person.setAttribute('aria-label',seller.name);person.style.backgroundImage='url("'+seller.portrait+'")';visitor.replaceChildren(person);
    }
    board.querySelectorAll(':scope>.visitor-dialogue').forEach(el=>el.remove());
    document.getElementById('counterParcels').replaceChildren();
    document.getElementById('counterParcelHint').hidden=true;document.getElementById('counterReceipt').hidden=true;
  }
  function interceptReception() {
    if (active()) return true;
    const c=api.campaign();
    if (menu.hidden && c && trade.ready(c) && free() && !D.pending && !route.snapshot().reading && api.merchantAction('arrive')) {
      route.navigate('orders'); schedule(); return true;
    }
    return false;
  }
  function request(action) {
    if (!free()||D.pending||!api.merchantAction(action)) return false;
    route.navigate('orders'); window.AlchemyCounterDisplay.focus();return true;
  }
  callButton.onclick=()=>request('call');recallButton.onclick=()=>request('recall');
  function sync() {
    queued=false;
    const c=api.campaign(),a=c?.sellers?.active,s=c?.sellers,view=route.snapshot();
    if (!c||!api.snapshot().started||!menu.hidden) return;
    document.body.dataset.merchantVisit=a?.phase||'';
    const canRequest=c.phase==='open'&&!a&&!window.AlchemyCraftBuyer?.atCounter;
    callButton.hidden=!canRequest||c.economy.stock[0]>1;recallButton.hidden=!canRequest||!s?.held;
    services.hidden=callButton.hidden&&recallButton.hidden;
    callButton.disabled=recallButton.disabled=!free()||!!D.pending;
    if(s?.held)recallButton.textContent='取'+window.AlchemyEconomy.TOOL_DEFS.find(t=>t.id===s.held.id).name;
    if (!restored) {
      restored=true;
      if (a && a.phase!=='equip') route.navigate('orders',{internal:true});
    }
    if (!a) { equipShown=false; if(!view.reading)interceptReception(); return; }
    if (!free()) return;
    if (a.phase==='equip') {
      if (!equipShown) {equipShown=true;route.navigate('work',{internal:true,workMode:'room'});window.AlchemyEquipmentView.inspect(null);}
      else if (view.current!=='equipment'||c.economy.equipped.length) finish();
      return;
    }
    if (view.current!=='orders') return;
    if (a.phase==='greet'||a.phase==='bought') {
      const graph=a.phase==='greet'?'merchant':'merchant_equipment';
      if (D.pending) {if (D.pending.graph===graph) D.resumeConversation();return;}
      if (a.phase==='greet' && D.flags.merchantDecision) {
        api.merchantAction(D.flags.merchantDecision==='market'?'show':'leave');return;
      }
      if (a.phase==='bought' && D.flags.merchantEquipmentRead) {api.merchantAction('equip');return;}
      const t=window.AlchemyEconomy.TOOL_DEFS.find(t=>t.id==='ward');
      D.start(graph,{day:c.day,orderId:'merchant-visit-v205',toolName:t.name,price:t.price});
    }
  }
  function finish(){if(api.merchantAction('leave'))window.dispatchEvent(new Event('alchemy:interaction'));}
  function schedule(){if(!queued){queued=true;queueMicrotask(sync);}}
  window.AlchemyMerchantVisit={get atCounter(){const a=active();return !!a && a.phase!=='equip';},get busy(){return !!active();},interceptReception,paintCounter,call:()=>request('call')};
  window.addEventListener('alchemy:dialogue-ended',e=>{
    if(e.detail.graph==='merchant' && active()?.phase==='greet') {
      if(D.flags.merchantDecision==='market'){api.merchantAction('show');window.AlchemyCounterDisplay.focus();}
      else finish();
    } else if(e.detail.graph==='merchant_equipment' && active()?.phase==='bought') api.merchantAction('equip');
    schedule();
  });
  for (const e of ['alchemy:render','alchemy:interaction','alchemy:view-ready','alchemy:dialogue-state','alchemy:opening-finished']) window.addEventListener(e,schedule);
  new MutationObserver(schedule).observe(menu,{attributes:true,attributeFilter:['hidden']});schedule();
})();
