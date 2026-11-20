/* One extra visitor per save; transactions remain owned by AlchemyGame. */
(() => {
 'use strict';
 const api=window.AlchemyGame,saves=window.AlchemySaves,D=window.AlchemyDialogue;
 const key='merchant-visit-v205',art='assets/scene-props-v42/merchant.webp';
 const board=document.querySelector('.counter-board'),visitor=document.getElementById('counterVisitor');
 let scheduled=false,restored=false,marketSelected=false;
 function record(){const value=saves.preference(key);return value?.version===1?value:{version:1,phase:'unseen'};}
 function save(phase,extra={}){if(!saves.setPreference(key,{...record(),...extra,version:1,phase}))return false;window.dispatchEvent(new Event('alchemy:merchant-change'));return true;}
 function count(c){return c.history.reduce((n,d)=>n+(d.completed||0)+(d.failed||0),0)+c.orders.filter(o=>['completed','failed'].includes(o.status)).length;}
 function safe(){const c=api.campaign(),s=api.snapshot();return c?.phase==='open'&&s.started&&!c.activeId&&s.pillEnded&&!s.busy&&!window.AlchemyScene2D?.busy&&!window.AlchemyScene2D?.held&&!window.AlchemyInteractionBusy;}
 function running(){return ['counter','market','equip'].includes(record().phase);}
 function finish(){marketSelected=false;save('done');window.dispatchEvent(new Event('alchemy:interaction'));}
 function context(){const t=window.AlchemyEconomy.TOOL_DEFS.find(t=>t.id==='ward');return {day:api.campaign().day,orderId:'merchant-visit-v205',toolName:t.name,price:t.price};}
 function paintCounter(){
  board.dataset.counterState='merchant';visitor.classList.remove('is-away');
  if(visitor.dataset.visitorKey!=='merchant-v205'){
   visitor.dataset.visitorKey='merchant-v205';visitor.replaceChildren();
   const person=document.createElement('div');person.className='visitor-portrait';person.dataset.artLayout='native-v61';person.dataset.artState='neutral';person.dataset.appearanceId='market-merchant';person.setAttribute('role','img');person.setAttribute('aria-label','法器商 · 坊市法器摊主');person.style.backgroundImage=`url("${art}")`;visitor.append(person);
  }
  board.querySelectorAll(':scope>.visitor-dialogue').forEach(el=>el.remove());
  document.getElementById('counterParcels').replaceChildren();document.getElementById('counterParcelHint').hidden=true;
  document.getElementById('counterReceipt').hidden=true;
 }
 function interceptReception(){
  if(running())return true;
  if(record().phase!=='unseen'||!safe()||count(api.campaign())<2)return false;
  if(!save('counter'))return false;
  window.AlchemyViewState.navigate('orders');schedule();return true;
 }
 function sync(){
  scheduled=false;
  const menu=document.getElementById('mainMenu');if(!api.snapshot().started||!menu?.hidden)return;
  let r=record();document.body.dataset.merchantVisit=r.phase;resume.hidden=r.phase!=='counter';
  const decision=D.flags.merchantDecision;
  if(r.phase==='counter'&&decision){if(!save(decision==='market'?'market':'done'))return;r=record();if(decision==='declined'){window.dispatchEvent(new Event('alchemy:interaction'));return;}}
  if(!restored){restored=true;if(r.phase==='market')window.AlchemyViewState.navigate('shop',{internal:true});else if(r.phase==='equip'){window.AlchemyViewState.navigate('work',{internal:true,workMode:'room'});requestAnimationFrame(()=>window.AlchemyEquipmentView.inspect(null));}}
  if(!safe()||D.blocking||document.querySelector('dialog[open]'))return;
  if(r.phase==='unseen'){
   if(count(api.campaign())>=2)interceptReception();return;
  }
  if(r.phase==='counter'){
   window.AlchemyViewState.navigate('orders');paintCounter();
   if(D.pending){if(D.pending.graph==='merchant')D.resumeConversation();return;}
   D.start('merchant',context());return;
  }
  const view=window.AlchemyViewState.snapshot();
  if(r.phase==='market'){
   if(!marketSelected){if(view.current!=='shop'){window.AlchemyViewState.navigate('shop');return;}window.AlchemyMarketLayout.inspectTool('ward');marketSelected=true;}
   if(view.location!=='shop'){finish();return;}
   const owned=api.campaign().economy.tools;
   if(owned.length&&!D.flags.merchantEquipmentRead){
    if(D.pending?.graph==='merchant_equipment')D.resumeConversation();else if(!D.pending)D.start('merchant_equipment',context());
   }
  }else if(r.phase==='equip'){
   if(window.AlchemyEconomy.equippedIds(api.campaign().economy.equipped).length||view.location==='orders')finish();
  }
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(sync);}}
 window.AlchemyMerchantVisit={get atCounter(){return record().phase==='counter';},interceptReception,paintCounter,snapshot:record};
 window.addEventListener('alchemy:dialogue-ended',e=>{
  if(e.detail.graph==='merchant'){
   // Closing via settings is equivalent to declining, never an implicit purchase.
   const accepted=D.flags.merchantDecision==='market';
   if(!save(accepted?'market':'done'))return;
   if(accepted){marketSelected=false;window.AlchemyViewState.navigate('shop');}else window.dispatchEvent(new Event('alchemy:interaction'));
  }else if(e.detail.graph==='merchant_equipment'){
   if(!save('equip'))return;
   window.AlchemyViewState.navigate('work',{workMode:'room'});
   requestAnimationFrame(()=>window.AlchemyEquipmentView.inspect(null));
  }
  schedule();
 });
 for(const event of ['alchemy:render','alchemy:interaction','alchemy:view-ready','alchemy:dialogue-state','alchemy:merchant-change','alchemy:opening-finished'])window.addEventListener(event,schedule);
 // Keep a physical conversation entrance if a saved start needs retrying.
 const resume=document.createElement('button');resume.id='merchantConversation';resume.className='counter-conversation';resume.type='button';resume.textContent='与法器商交谈';resume.hidden=true;board.append(resume);
 resume.onclick=()=>D.pending?.graph==='merchant'?D.resumeConversation():D.start('merchant',context());
 window.addEventListener('alchemy:merchant-change',()=>{document.body.dataset.merchantVisit=record().phase;resume.hidden=record().phase!=='counter';});
 new MutationObserver(schedule).observe(document.getElementById('mainMenu'),{attributes:true,attributeFilter:['hidden']});
 schedule();
})();
