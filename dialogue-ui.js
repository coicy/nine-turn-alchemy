/* === Consolidated source: dialogue-ui.js === */
(() => {
  'use strict';
  const content=window.AlchemyDialogueContent,media=matchMedia('(prefers-reduced-motion: reduce)');
  const root=document.createElement('dialog');root.id='gameDialogue';root.className='game-dialogue';root.setAttribute('aria-label','角色对话');
  root.innerHTML=`<section data-dialogue-view="conversation"><div class="dialogue-main"><div class="dialogue-portrait" aria-hidden="true"><span></span></div><div class="dialogue-copy"><header><strong id="dialogueSpeaker"></strong><span id="dialogueRole"></span><small id="dialogueTitle"></small></header><p id="dialogueAccessible" class="dialogue-sr" aria-live="polite"></p><button type="button" id="dialogueAdvance" aria-label="显示完整对白"><span id="dialogueText" aria-hidden="true"></span><i aria-hidden="true">▾</i></button><dl id="dialogueFacts" hidden></dl><div id="dialogueChoices" aria-label="选择回应"></div></div></div><footer><span id="dialogueProgress"></span><button type="button" id="dialogueAuto" aria-pressed="false">自动</button><button type="button" id="dialogueSkip" aria-pressed="false">已读快进</button><button type="button" data-dialogue-history>回看</button><button type="button" data-dialogue-settings>设置</button><button type="button" id="dialogueLeave">暂别</button><button type="button" id="dialogueNext" class="dialogue-primary">继续</button></footer></section><section data-dialogue-view="history" hidden><header class="dialogue-subhead"><h2>交谈回看</h2><button type="button" data-dialogue-back>返回</button></header><div id="dialogueHistory" tabindex="0"></div><small>仅回看已出现的对白，不会重放选择或交易。</small></section><section data-dialogue-view="settings" hidden><header class="dialogue-subhead"><h2>对话设置</h2><button type="button" data-dialogue-back>返回</button></header><label>文字显示<select id="dialogueSpeed"><option value="55">慢速</option><option value="32">标准</option><option value="18">快速</option><option value="0">立即显示</option></select></label><label>自动阅读停留<select id="dialogueDelay"><option value="800">较短</option><option value="1200">标准</option><option value="2000">较长</option></select></label><p>点击文字或按空格先显示整句，再次操作才进入下一句。分支选择不会自动代选。系统减少动态时直接显示整句。</p></section><section data-dialogue-view="confirm" hidden><h2>跳过开场？</h2><p>将直接开始经营，未读对白不计为已读。</p><button type="button" id="dialogueKeep">继续阅读</button><button type="button" id="dialogueConfirmSkip" class="dialogue-primary">跳过开场</button></section><p id="dialogueStatus" role="status"></p>`;
  document.body.append(root);const $=id=>document.getElementById(id);
  const readingTools=document.createElement('div');readingTools.id='dialogueReadingTools';readingTools.hidden=true;
  root.querySelector('[data-dialogue-view="settings"]').append(readingTools);
  function placeReadingTools(opening){
    const footer=root.querySelector('footer'),anchor=footer.querySelector('[data-dialogue-history]');
    for(const id of ['dialogueAuto','dialogueSkip']){
      const button=$(id),host=opening?readingTools:footer;
      if(button.parentElement!==host){if(opening)host.append(button);else host.insertBefore(button,anchor);}
    }
    readingTools.hidden=!opening;
  }
  let runtime,view='conversation',current=null,token=null,chars=0,typingTimer=null,autoTimer=null,automatic=false,skipping=false,returnFocus=null,lastInput=0;
  const clearTimers=()=>{clearTimeout(typingTimer);clearTimeout(autoTimer);typingTimer=autoTimer=null;};
  function modes(){ $('dialogueAuto').setAttribute('aria-pressed',String(automatic));$('dialogueAuto').textContent=automatic?'自动：开':'自动';$('dialogueSkip').setAttribute('aria-pressed',String(skipping)); }
  function pause(){automatic=skipping=false;clearTimeout(autoTimer);modes();}
  function notify(info={}){
    if(runtime.active){show();render();}
    else if(info.ended||info.suspended){clearTimers();pause();if(root.open)root.close();token=null;current=null;restoreFocus();}
    else if(runtime.error&&!root.open){returnFocus=document.activeElement;root.showModal();setView('settings');}
    if(runtime.error)$('dialogueStatus').textContent=runtime.error;
    window.dispatchEvent(new CustomEvent('alchemy:dialogue-state',{detail:{active:runtime.active,...info}}));
    if(info.ended){window.dispatchEvent(new CustomEvent('alchemy:dialogue-ended',{detail:info}));if(info.action==='letter')openLetter(info.context?.orderId);}
  }
  runtime=window.AlchemyDialogueEngine.create(content,{read:()=>window.AlchemySaves.preference('dialogue-v192'),write:s=>window.AlchemySaves.setPreference('dialogue-v192',s)},notify);
  Object.defineProperty(runtime,'blocking',{get:()=>runtime.active||root.open});
  window.AlchemyDialogue=runtime;
  function show(){if(!root.open){returnFocus=document.activeElement;root.showModal();setView('conversation');}}
  function restoreFocus(){if(returnFocus?.isConnected&&!returnFocus.inert&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});else document.querySelector('.world-location-toggle')?.focus({preventScroll:true});}
  function setView(next){view=next;root.dataset.view=next;root.querySelectorAll('[data-dialogue-view]').forEach(el=>{el.hidden=el.dataset.dialogueView!==next;});if(next!=='conversation')pause();}
  function updatePortrait(p){const el=root.querySelector('.dialogue-portrait');el.style.backgroundImage='none';el.querySelector('span').textContent=p.speaker.seal||'客';el.dataset.art='seal';
    if(p.speaker===undefined)return;
    if(content.graphs[p.graph].nodes[p.node].speaker==='visitor'){
      const profile=window.AlchemyCustomers.catalog.profiles.find(x=>x.id===p.context.customerId),a=profile&&window.AlchemyCustomers.appearance(profile,p.expression);
      if(a){const f=a.frame;el.dataset.art='portrait';el.style.backgroundImage=`url("${f.src}")`;el.style.backgroundSize=`${f.columns*100}% ${f.rows*100}%`;el.style.backgroundPosition=`${f.columns===1?50:f.column/(f.columns-1)*100}% ${f.rows===1?0:f.row/(f.rows-1)*100}%`;}
    }
  }
  function paintChoices(){const host=$('dialogueChoices');host.replaceChildren();for(const [i,c]of current.choices.entries()){
    const b=document.createElement('button');b.type='button';b.dataset.dialogueChoice=c.id;b.disabled=!c.enabled;
    const label=document.createElement('span');label.textContent=c.text;b.append(label);
    if(!c.enabled){const reason=document.createElement('small');reason.className='dialogue-choice-reason';reason.textContent=c.reason;b.append(reason);}
    const key=document.createElement('kbd');key.className='dialogue-choice-key';key.textContent=String(i+1);key.setAttribute('aria-hidden','true');b.append(key);b.setAttribute('aria-keyshortcuts',String(i+1));
    b.onclick=()=>{if(!readyInput())return;pause();runtime.choose(c.id,current.token);};host.append(b);
  }host.hidden=!!current.choices.length&&!runtime.present()?.read;$('dialogueNext').hidden=!!current.choices.length;}
  function facts(p){const el=$('dialogueFacts');el.hidden=!p.facts;el.replaceChildren();if(p.facts)for(const [label,value]of [['药材',p.context.materials+'包 · '+p.context.nature],['所求药力',p.context.target],['约定工钱',p.context.fee+'文']]){const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;item.append(dt,dd);el.append(item);}}
  function render(){
    const p=runtime.present();if(!p)return;
    const node=content.graphs[p.graph].nodes[p.node],scene=window.AlchemyViewState.snapshot();
    root.dataset.kind=p.kind;placeReadingTools(p.kind==='opening');
    root.dataset.openingShot=p.graph==='opening'?(node.shot||''):'';
    if(p.scene&&(scene.current!==p.scene||(node.workMode&&scene.workMode!==node.workMode)))
      window.AlchemyViewState.navigate(p.scene,{internal:true,...(node.workMode?{workMode:node.workMode}:{})});
    const changed=token!==p.token;current=p;
    if(!changed){$('dialogueSpeed').value=runtime.settings.speed;$('dialogueDelay').value=runtime.settings.autoDelay;return;}
    clearTimers();setView('conversation');token=p.token;chars=0;$('dialogueStatus').textContent=runtime.error;
    $('dialogueSpeaker').textContent=p.speaker.name;$('dialogueRole').textContent=p.speaker.role||'';$('dialogueTitle').textContent=p.title;updatePortrait(p);facts(p);
    $('dialogueAccessible').textContent=p.speaker.name+'：'+p.text;$('dialogueText').textContent='';
    $('dialogueLeave').textContent=p.kind==='opening'?'跳过开场':p.kind==='commission'?'离开':p.kind==='buyer'?'暂不出售':p.kind==='merchant'?(p.graph==='merchant'?'改日再说':'回丹房布置'):'暂别';$('dialogueLeave').title=p.kind==='opening'?'确认后跳过开场':p.kind==='commission'?'回到柜台':p.kind==='merchant'?'结束本次交谈':'保留当前句，稍后继续';$('dialogueNext').textContent=p.kind==='opening'?(node.next==='end'?'开始经营':'继续'):p.nextText;
    $('dialogueSkip').disabled=!p.wasSeen;$('dialogueSkip').hidden=p.kind==='opening'&&!p.wasSeen;paintChoices();$('dialogueNext').disabled=true;
    $('dialogueAdvance').setAttribute('aria-label','显示完整对白');$('dialogueProgress').textContent='';
    modes();if(skipping&&!p.wasSeen){skipping=false;modes();$('dialogueStatus').textContent='来到未读对白，快进已停止。';}
    if(p.read||media.matches||runtime.settings.speed===0||skipping)reveal();else type();
    requestAnimationFrame(()=>$('dialogueAdvance').focus({preventScroll:true}));
  }
  function type(){if(!runtime.active||view!=='conversation')return;const points=Array.from(current.text);chars=Math.min(points.length,chars+1);$('dialogueText').textContent=points.slice(0,chars).join('');if(chars===points.length)reveal();else typingTimer=setTimeout(type,runtime.settings.speed);}
  function continueTyping(){if(!runtime.present()?.read){if(media.matches||runtime.settings.speed===0)reveal();else type();}else scheduleAuto();}
  function reveal(){clearTimeout(typingTimer);if(!current)return;$('dialogueText').textContent=current.text;chars=Array.from(current.text).length;
    if(!runtime.markRead()){$('dialogueStatus').textContent=runtime.error;$('dialogueNext').disabled=false;return;}
    current=runtime.present();$('dialogueStatus').textContent=runtime.error;$('dialogueChoices').hidden=false;$('dialogueNext').disabled=!!current.choices.length;
    $('dialogueAdvance').setAttribute('aria-label',current.choices.length?'请选择回应':'下一句');$('dialogueProgress').textContent=current.choices.length?'请选择回应':'点击继续';scheduleAuto();
  }
  function scheduleAuto(){clearTimeout(autoTimer);if(!runtime.active||view!=='conversation'||current.choices.length)return;
    if(skipping&&current.wasSeen)autoTimer=setTimeout(()=>runtime.advance(current.token),160);
    else if(automatic)autoTimer=setTimeout(()=>runtime.advance(current.token),runtime.settings.autoDelay+Array.from(current.text).length*22);
  }
  function readyInput(){const now=performance.now();if(now-lastInput<120)return false;lastInput=now;return true;}
  function advance(){if(!readyInput()||!current||view!=='conversation')return;if(!runtime.present().read)reveal();else runtime.advance(current.token);}
  $('dialogueAdvance').onclick=advance;$('dialogueNext').onclick=()=>{if(!runtime.present()?.read)reveal();else advance();};
  $('dialogueAuto').onclick=()=>{automatic=!automatic;skipping=false;modes();if(runtime.present()?.read)scheduleAuto();};
  $('dialogueSkip').onclick=()=>{if(!current?.wasSeen)return;skipping=!skipping;automatic=false;modes();if(skipping)reveal();else clearTimeout(autoTimer);};
  function leave(){if(current?.kind==='opening')setView('confirm');else if(['commission','merchant','buyer'].includes(current?.kind)){if(!runtime.end(false))runtime.suspend();}else runtime.suspend();}
  $('dialogueLeave').onclick=leave;
  function resumeReading(){setView('conversation');continueTyping();$('dialogueAdvance').focus({preventScroll:true});}
  $('dialogueKeep').onclick=resumeReading;$('dialogueConfirmSkip').onclick=()=>runtime.end(true);
  function history(){pause();clearTimeout(typingTimer);if(!root.open){returnFocus=document.activeElement;root.showModal();}setView('history');const el=$('dialogueHistory');el.replaceChildren();for(const row of runtime.history){const entry=document.createElement('article'),name=document.createElement('strong'),line=document.createElement('p');name.textContent=row.speaker+' · 第'+row.day+'日';line.textContent=row.text;entry.dataset.kind=row.kind;entry.append(name,line);el.append(entry);}if(!el.childElementCount)el.textContent='还没有交谈记录。';el.scrollTop=el.scrollHeight;requestAnimationFrame(()=>root.querySelector('[data-dialogue-view="history"] [data-dialogue-back]').focus());}
  function settings(){pause();clearTimeout(typingTimer);if(!root.open){returnFocus=document.activeElement;root.showModal();}setView('settings');$('dialogueSpeed').value=runtime.settings.speed;$('dialogueDelay').value=runtime.settings.autoDelay;}
  root.querySelectorAll('[data-dialogue-history]').forEach(b=>b.onclick=history);root.querySelectorAll('[data-dialogue-settings]').forEach(b=>b.onclick=settings);
  root.querySelectorAll('[data-dialogue-back]').forEach(b=>b.onclick=()=>{if(runtime.active)resumeReading();else{root.close();restoreFocus();}});
  $('dialogueSpeed').onchange=()=>runtime.setSettings({speed:Number($('dialogueSpeed').value)});$('dialogueDelay').onchange=()=>runtime.setSettings({autoDelay:Number($('dialogueDelay').value)});
  function focusables(){return [...root.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[tabindex]:not([tabindex="-1"])')].filter(el=>{const r=el.getBoundingClientRect(),c=getComputedStyle(el);return !el.hidden&&!el.closest('[hidden],[inert]')&&c.display!=='none'&&c.visibility!=='hidden'&&r.width>0&&r.height>0;});}
  root.addEventListener('cancel',e=>{e.preventDefault();if(view!=='conversation'){root.querySelector(`[data-dialogue-view="${view}"] [data-dialogue-back]`)?.click();if(view==='confirm')$('dialogueKeep').click();}else if(runtime.active)leave();else root.close();});
  document.addEventListener('keydown',e=>{if(!root.open||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
    if(e.key==='Tab'){const list=focusables();if(!list.length)return;const i=list.indexOf(document.activeElement),next=list[i<0?(e.shiftKey?list.length-1:0):(i+(e.shiftKey?-1:1)+list.length)%list.length];e.preventDefault();e.stopImmediatePropagation();next.focus({preventScroll:true});return;}
    if(view==='conversation'&&/^[1-9]$/.test(e.key)&&runtime.present()?.read){const c=current.choices[Number(e.key)-1];if(c?.enabled){e.preventDefault();pause();runtime.choose(c.id,current.token);}return;}
    if(view==='conversation'&&[' ','Enter'].includes(e.key)&&(e.target===$('dialogueAdvance')||e.target===root)){e.preventDefault();e.stopImmediatePropagation();advance();}
    if(view==='conversation'&&['ArrowUp','ArrowDown'].includes(e.key)&&current?.choices.length){const buttons=[...$('dialogueChoices').querySelectorAll('button:not(:disabled)')];const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[i<0?(e.key==='ArrowDown'?0:buttons.length-1):(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}
  },true);
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();clearTimeout(typingTimer);}else if(runtime.active&&view==='conversation')continueTyping();});media.addEventListener('change',()=>{if(runtime.active&&view==='conversation'&&!document.hidden)reveal();});
  function available(){const s=window.AlchemyGame.snapshot();return s.started&&!s.busy&&!window.AlchemyScene2D?.busy&&!window.AlchemyScene2D?.held&&!window.AlchemyInteractionBusy&&!document.querySelector('dialog[open]');}
  const startGraph=runtime.start,resumeGraph=runtime.resume;
  runtime.start=(gid,...args)=>available()?startGraph(gid==='visitor'?'commission':gid,...args):false;
  runtime.resume=()=>{if(!available())return false;const pending=runtime.pending;if(pending?.graph==='visitor'){const c=window.AlchemyGame.campaign(),order=c.orders.find(o=>o.id===pending.context.orderId&&['pending','active'].includes(o.status))||window.AlchemyGame.snapshot().order||c.orders.find(o=>o.status==='pending');return order?runtime.replacePending('commission',context(order)):runtime.end(false);}return resumeGraph();};
  function context(order){
    const p=window.AlchemyCustomers.profile(order),c=window.AlchemyGame.campaign(),stage=window.AlchemyCustomers.arcStageData?.(order);
    const prev=order?.arcPrevOutcome==='completed'?stage?.prevCompleted:order?.arcPrevOutcome?stage?.prevFailed:'';
    return {day:c.day,visitor:p.name,role:p.role,customerId:p.id,orderId:order.id,materials:order.materials,target:order.target,fee:window.AlchemyEconomy.fee(order),nature:({warm:'温性',cool:'寒性',neutral:'平性'}[order.nature]||'平性'),request:p.request||'想请掌柜代炼。',arcStage:order?.arcStage||0,arcAction:stage?.action||'',arcDemand:stage?((prev?prev+' ':'')+stage.pending):(p.request||'想请掌柜代炼。')};
  }
  runtime.openVisitor=order=>{if(!available())return false;const targetGraph=order?.arcId?'special_commission':'commission',pending=runtime.pending;if(pending&&['visitor','commission','special_commission'].includes(pending.graph)){if(pending.graph===targetGraph&&pending.context.orderId===order.id)return runtime.resume();return runtime.replacePending(targetGraph,context(order));}if(pending){runtime.resume();return true;}return runtime.start(targetGraph,context(order));};
  runtime.openOpening=step=>{if(!available())return false;const s=window.AlchemyGame.snapshot(),order=s.order||window.AlchemyGame.campaign().orders[0];return runtime.start('opening',context(order),{node:content.graphs.opening.legacySteps[step]||content.graphs.opening.start});};
  runtime.showHistory=()=>{if(!runtime.active&&!available())return false;history();return true;};runtime.showSettings=()=>{if(!runtime.active&&!available())return false;settings();return true;};
  runtime.resumeConversation=()=>{if(!available())return false;return runtime.resume();};runtime.contextFor=context;
  function openLetter(orderId){if(orderId&&!window.AlchemyGame.campaign()?.orders.some(o=>o.id===orderId))return;let timer;const attempt=()=>{if(window.AlchemyViewState.snapshot().current!=='orders')return;if(orderId&&selectedOrder()?.id!==orderId)document.querySelector('[data-letter="'+CSS.escape(orderId)+'"]')?.click();const note=$('counterNote');if(note&&!note.hidden){if(note.getAttribute('aria-expanded')!=='true')note.click();window.removeEventListener('alchemy:counter-note-availability',attempt);clearTimeout(timer);}};if(window.AlchemyViewState.snapshot().current!=='orders')window.AlchemyViewState.navigate('orders',{internal:true});window.addEventListener('alchemy:counter-note-availability',attempt);timer=setTimeout(()=>window.removeEventListener('alchemy:counter-note-availability',attempt),1500);attempt();}
  const entry=document.createElement('button');entry.type='button';entry.id='counterConversation';entry.className='counter-conversation';document.querySelector('.counter-board').append(entry);
  function selectedOrder(){const id=document.querySelector('#counterVisitor .visitor-portrait')?.dataset.visitId;return window.AlchemyGame.campaign()?.orders.find(o=>o.id===id);}
  entry.onclick=()=>{const order=selectedOrder();if(order)runtime.openVisitor(order);};
  function updateEntry(){const order=selectedOrder(),p=order&&window.AlchemyCustomers.profile(order);entry.hidden=!order||!['pending','active'].includes(order.status)||window.AlchemyViewState.snapshot().current!=='orders'||window.AlchemyOpening?.active;entry.textContent=p?p.name+' · 委托来意':'委托来意';}
  new MutationObserver(updateEntry).observe($('counterVisitor'),{childList:true});window.addEventListener('alchemy:render',updateEntry);window.addEventListener('alchemy:view-ready',updateEntry);window.addEventListener('alchemy:opening-finished',updateEntry);
  const menus=[document.getElementById('worldBooksMenu'),document.querySelector('#mainMenuSettingsPanel .main-menu__settings-actions')].filter(Boolean);
  for(const host of menus){const b=document.createElement('button');b.type='button';b.textContent='交谈回看';b.onclick=()=>{if(document.getElementById('mainMenu').hidden)runtime.showHistory();else history();};host.append(b);}
  const host=document.getElementById('worldSettings');for(const [label,fn] of [['对话设置',runtime.showSettings],['继续交谈',runtime.resumeConversation],['结束本段交谈',()=>runtime.end(false)]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{document.querySelector('.world-settings-toggle[aria-expanded="true"]')?.click();fn();};host.append(b);}
  const end=document.createElement('button');end.type='button';end.textContent='结束本段交谈';end.title='结束本次交谈，下次从开头开始';end.disabled=!runtime.pending;end.onclick=()=>runtime.end(false);root.querySelector('[data-dialogue-view="settings"]').append(end);
  window.addEventListener('alchemy:dialogue-state',()=>{end.hidden=current?.kind==='opening';end.disabled=!runtime.pending;});
  if(runtime.error)$('dialogueStatus').textContent=runtime.error;updateEntry();
  function fitLayout(){const box=root.querySelector('.dialogue-main');root.style.setProperty('--dialogue-box-height',box.offsetHeight+'px');}
  new ResizeObserver(fitLayout).observe(root.querySelector('.dialogue-main'));window.addEventListener('resize',fitLayout);
})();
;
/* === Consolidated source: merchant-visit.js === */
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
;
/* === Consolidated source: craft-buyer.js === */
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
