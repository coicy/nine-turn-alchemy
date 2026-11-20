(() => {
  'use strict';
  const content=window.AlchemyDialogueContent,media=matchMedia('(prefers-reduced-motion: reduce)');
  const root=document.createElement('dialog');root.id='gameDialogue';root.className='game-dialogue';root.setAttribute('aria-label','角色对话');
  root.innerHTML=`<section data-dialogue-view="conversation"><div class="dialogue-main"><div class="dialogue-portrait" aria-hidden="true"><span></span></div><div class="dialogue-copy"><header><strong id="dialogueSpeaker"></strong><span id="dialogueRole"></span><small id="dialogueTitle"></small></header><p id="dialogueAccessible" class="dialogue-sr" aria-live="polite"></p><button type="button" id="dialogueAdvance" aria-label="显示完整对白"><span id="dialogueText" aria-hidden="true"></span><i aria-hidden="true">▾</i></button><dl id="dialogueFacts" hidden></dl><div id="dialogueChoices" aria-label="选择回应"></div></div></div><footer><span id="dialogueProgress"></span><button type="button" id="dialogueAuto" aria-pressed="false">自动</button><button type="button" id="dialogueSkip" aria-pressed="false">已读快进</button><button type="button" data-dialogue-history>回看</button><button type="button" data-dialogue-settings>设置</button><button type="button" id="dialogueLeave">暂别</button><button type="button" id="dialogueNext" class="dialogue-primary">继续</button></footer></section><section data-dialogue-view="history" hidden><header class="dialogue-subhead"><h2>交谈回看</h2><button type="button" data-dialogue-back>返回</button></header><div id="dialogueHistory" tabindex="0"></div><small>仅回看已出现的对白，不会重放选择或交易。</small></section><section data-dialogue-view="settings" hidden><header class="dialogue-subhead"><h2>对话设置</h2><button type="button" data-dialogue-back>返回</button></header><label>文字显示<select id="dialogueSpeed"><option value="55">慢速</option><option value="32">标准</option><option value="18">快速</option><option value="0">立即显示</option></select></label><label>自动阅读停留<select id="dialogueDelay"><option value="800">较短</option><option value="1200">标准</option><option value="2000">较长</option></select></label><p>点击文字或按空格先显示整句，再次操作才进入下一句。分支选择不会自动代选。系统减少动态时直接显示整句。</p></section><section data-dialogue-view="confirm" hidden><h2>跳过开场？</h2><p>将直接开始经营。未读对白不会标记为已读，也不会替你作出交易选择。</p><button type="button" id="dialogueKeep">继续阅读</button><button type="button" id="dialogueConfirmSkip" class="dialogue-primary">跳过开场</button></section><p id="dialogueStatus" role="status"></p>`;
  document.body.append(root);const $=id=>document.getElementById(id);
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
    if(info.ended){window.dispatchEvent(new CustomEvent('alchemy:dialogue-ended',{detail:info}));if(info.action==='letter')openLetter();}
  }
  runtime=window.AlchemyDialogueEngine.create(content,{read:()=>window.AlchemySaves.preference('dialogue-v192'),write:s=>window.AlchemySaves.setPreference('dialogue-v192',s)},notify);
  Object.defineProperty(runtime,'blocking',{get:()=>runtime.active||root.open});
  window.AlchemyDialogue=runtime;
  function show(){if(!root.open){returnFocus=document.activeElement;root.showModal();setView('conversation');}}
  function restoreFocus(){if(returnFocus?.isConnected&&!returnFocus.inert&&returnFocus.getClientRects().length)returnFocus.focus({preventScroll:true});else document.querySelector('.world-location-toggle')?.focus({preventScroll:true});}
  function setView(next){view=next;root.querySelectorAll('[data-dialogue-view]').forEach(el=>{el.hidden=el.dataset.dialogueView!==next;});if(next!=='conversation')pause();}
  function updatePortrait(p){const el=root.querySelector('.dialogue-portrait');el.style.backgroundImage='none';el.querySelector('span').textContent=p.speaker.seal||'客';el.dataset.art='seal';
    if(p.speaker===undefined)return;
    if(content.graphs[p.graph].nodes[p.node].speaker==='visitor'){
      const profile=window.AlchemyCustomers.catalog.profiles.find(x=>x.id===p.context.customerId),a=profile&&window.AlchemyCustomers.appearance(profile,p.expression);
      if(a){const f=a.frame;el.dataset.art='portrait';el.style.backgroundImage=`url("${f.src}")`;el.style.backgroundSize=`${f.columns*100}% ${f.rows*100}%`;el.style.backgroundPosition=`${f.columns===1?50:f.column/(f.columns-1)*100}% ${f.rows===1?0:f.row/(f.rows-1)*100}%`;}
    }
  }
  function paintChoices(){const host=$('dialogueChoices');host.replaceChildren();for(const [i,c]of current.choices.entries()){
    const b=document.createElement('button');b.type='button';b.dataset.dialogueChoice=c.id;b.disabled=!c.enabled;b.textContent=(i+1)+'  '+c.text+(c.enabled?'':' · '+c.reason);b.onclick=()=>{if(!readyInput())return;pause();runtime.choose(c.id,current.token);};host.append(b);
  }host.hidden=!!current.choices.length&&!runtime.present()?.read;$('dialogueNext').hidden=!!current.choices.length;}
  function facts(p){const el=$('dialogueFacts');el.hidden=!p.facts;el.replaceChildren();if(p.facts)for(const [label,value]of [['药材',p.context.materials+'包 · '+p.context.nature],['所求药力',p.context.target],['约定工钱',p.context.fee+'文']]){const item=document.createElement('div'),dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;item.append(dt,dd);el.append(item);}}
  function render(){
    const p=runtime.present();if(!p)return;
    if(p.scene&&window.AlchemyViewState.snapshot().current!==p.scene)window.AlchemyViewState.navigate(p.scene,{internal:true});
    const changed=token!==p.token;current=p;
    if(!changed){$('dialogueSpeed').value=runtime.settings.speed;$('dialogueDelay').value=runtime.settings.autoDelay;return;}
    clearTimers();setView('conversation');token=p.token;chars=0;$('dialogueStatus').textContent=runtime.error;
    $('dialogueSpeaker').textContent=p.speaker.name;$('dialogueRole').textContent=p.speaker.role||'';$('dialogueTitle').textContent=p.title;updatePortrait(p);facts(p);
    $('dialogueAccessible').textContent=p.speaker.name+'：'+p.text;$('dialogueText').textContent='';
    $('dialogueLeave').textContent=p.kind==='opening'?'跳过开场':'暂别';$('dialogueLeave').title=p.kind==='opening'?'确认后跳过开场':'保留当前句，稍后继续';$('dialogueNext').textContent=p.nextText;
    $('dialogueSkip').disabled=!p.wasSeen;paintChoices();$('dialogueNext').disabled=true;
    $('dialogueAdvance').setAttribute('aria-label','显示完整对白');$('dialogueProgress').textContent='';
    modes();if(skipping&&!p.wasSeen){skipping=false;modes();$('dialogueStatus').textContent='来到未读对白，快进已停止。';}
    if(p.read||media.matches||runtime.settings.speed===0||skipping)reveal();else type();
    requestAnimationFrame(()=>$('dialogueAdvance').focus({preventScroll:true}));
  }
  function type(){if(!runtime.active||view!=='conversation')return;const points=Array.from(current.text);chars=Math.min(points.length,chars+1);$('dialogueText').textContent=points.slice(0,chars).join('');if(chars===points.length)reveal();else typingTimer=setTimeout(type,runtime.settings.speed);}
  function continueTyping(){if(!runtime.present()?.read){if(media.matches||runtime.settings.speed===0)reveal();else type();}}
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
  $('dialogueLeave').onclick=()=>{if(current.kind==='opening')setView('confirm');else runtime.suspend();};
  $('dialogueKeep').onclick=()=>{setView('conversation');continueTyping();};$('dialogueConfirmSkip').onclick=()=>runtime.end(true);
  function history(){pause();clearTimeout(typingTimer);if(!root.open){returnFocus=document.activeElement;root.showModal();}setView('history');const el=$('dialogueHistory');el.replaceChildren();for(const row of runtime.history){const entry=document.createElement('article'),name=document.createElement('strong'),line=document.createElement('p');name.textContent=row.speaker+' · 第'+row.day+'日';line.textContent=row.text;entry.dataset.kind=row.kind;entry.append(name,line);el.append(entry);}if(!el.childElementCount)el.textContent='还没有交谈记录。';el.scrollTop=el.scrollHeight;requestAnimationFrame(()=>root.querySelector('[data-dialogue-view="history"] [data-dialogue-back]').focus());}
  function settings(){pause();clearTimeout(typingTimer);if(!root.open){returnFocus=document.activeElement;root.showModal();}setView('settings');$('dialogueSpeed').value=runtime.settings.speed;$('dialogueDelay').value=runtime.settings.autoDelay;}
  root.querySelectorAll('[data-dialogue-history]').forEach(b=>b.onclick=history);root.querySelectorAll('[data-dialogue-settings]').forEach(b=>b.onclick=settings);
  root.querySelectorAll('[data-dialogue-back]').forEach(b=>b.onclick=()=>{if(runtime.active){setView('conversation');continueTyping();}else{root.close();restoreFocus();}});
  $('dialogueSpeed').onchange=()=>runtime.setSettings({speed:Number($('dialogueSpeed').value)});$('dialogueDelay').onchange=()=>runtime.setSettings({autoDelay:Number($('dialogueDelay').value)});
  root.addEventListener('cancel',e=>{e.preventDefault();if(view!=='conversation'){root.querySelector(`[data-dialogue-view="${view}"] [data-dialogue-back]`)?.click();if(view==='confirm')$('dialogueKeep').click();}else if(current?.kind==='opening')setView('confirm');else if(runtime.active)runtime.suspend();else root.close();});
  document.addEventListener('keydown',e=>{if(!root.open||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
    if(view==='conversation'&&/^[1-9]$/.test(e.key)&&runtime.present()?.read){const c=current.choices[Number(e.key)-1];if(c?.enabled){e.preventDefault();pause();runtime.choose(c.id,current.token);}return;}
    if(view==='conversation'&&[' ','Enter'].includes(e.key)&&(e.target===$('dialogueAdvance')||e.target===root)){e.preventDefault();e.stopImmediatePropagation();advance();}
    if(view==='conversation'&&['ArrowUp','ArrowDown'].includes(e.key)&&current?.choices.length){const buttons=[...$('dialogueChoices').querySelectorAll('button:not(:disabled)')];const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[i<0?(e.key==='ArrowDown'?0:buttons.length-1):(i+(e.key==='ArrowDown'?1:-1)+buttons.length)%buttons.length]?.focus();}
  },true);
  window.addEventListener('blur',pause);document.addEventListener('visibilitychange',()=>{if(document.hidden){pause();clearTimeout(typingTimer);}else if(runtime.active&&view==='conversation')continueTyping();});media.addEventListener('change',()=>{if(runtime.active&&view==='conversation'&&!document.hidden)reveal();});
  function available(){const s=window.AlchemyGame.snapshot();return s.started&&!s.busy&&!window.AlchemyScene2D?.busy&&!window.AlchemyScene2D?.held&&!window.AlchemyInteractionBusy&&!document.querySelector('dialog[open]');}
  const startGraph=runtime.start,resumeGraph=runtime.resume;
  runtime.start=(...args)=>available()?startGraph(...args):false;
  runtime.resume=()=>available()?resumeGraph():false;
  function context(order){const p=window.AlchemyCustomers.profile(order),c=window.AlchemyGame.campaign(),met=!!runtime.flags['met.'+p.id];return {day:c.day,visitor:p.name,role:p.role,customerId:p.id,orderId:order.id,materials:order.materials,target:order.target,fee:window.AlchemyEconomy.fee(order),nature:({warm:'温性',cool:'寒性',neutral:'平性'}[order.nature]||'平性'),request:p.request||'想请掌柜代炼。',met,greeting:met?content.strings['zh-CN'].visitor_return:window.AlchemyCustomers.line(order),smalltalk:/行商|信使|船客/.test(p.role)?'赶路的人，最怕临行前还在四处找药。单子写明白，交接也就省心。':/采药|药农/.test(p.role)?'进山采药得看天色，守炉也得看火候。今天这炉，就交给掌柜了。':'出门也好，闭关也好，准备周全些总是好事。掌柜照平常的节奏守炉便好。'};}
  runtime.openVisitor=order=>{if(!available())return false;if(runtime.pending&&runtime.pending.context.orderId!==order.id){runtime.resume();$('dialogueStatus').textContent='先继续上次交谈；也可在设置中结束本段，再与新来客交谈。';return true;}return runtime.start('visitor',context(order));};
  runtime.openOpening=step=>{if(!available())return false;const s=window.AlchemyGame.snapshot(),order=s.order||window.AlchemyGame.campaign().orders[0];return runtime.start('opening',context(order),{node:step===1?'arrival':step===2?'fire':'room'});};
  runtime.showHistory=()=>{if(!runtime.active&&!available())return false;history();return true;};runtime.showSettings=()=>{if(!runtime.active&&!available())return false;settings();return true;};
  runtime.resumeConversation=()=>{if(!available())return false;return runtime.resume();};runtime.contextFor=context;
  function openLetter(){let timer;const attempt=()=>{const note=$('counterNote');if(window.AlchemyViewState.snapshot().current!=='orders')return;if(note&&!note.hidden){if(note.getAttribute('aria-expanded')!=='true')note.click();window.removeEventListener('alchemy:counter-note-availability',attempt);clearTimeout(timer);}};if(window.AlchemyViewState.snapshot().current!=='orders')window.AlchemyViewState.navigate('orders',{internal:true});window.addEventListener('alchemy:counter-note-availability',attempt);timer=setTimeout(()=>window.removeEventListener('alchemy:counter-note-availability',attempt),1500);attempt();}
  const entry=document.createElement('button');entry.type='button';entry.id='counterConversation';entry.className='counter-conversation';document.querySelector('.counter-board').append(entry);
  function selectedOrder(){const id=document.querySelector('#counterVisitor .visitor-portrait')?.dataset.visitId;return window.AlchemyGame.campaign()?.orders.find(o=>o.id===id);}
  entry.onclick=()=>{const order=selectedOrder();if(order)runtime.openVisitor(order);};
  function updateEntry(){const order=selectedOrder(),p=order&&window.AlchemyCustomers.profile(order);entry.hidden=!order||!['pending','active'].includes(order.status)||window.AlchemyViewState.snapshot().current!=='orders'||window.AlchemyOpening?.active;entry.textContent=p?'与'+p.name+'交谈':'交谈';}
  new MutationObserver(updateEntry).observe($('counterVisitor'),{childList:true});window.addEventListener('alchemy:render',updateEntry);window.addEventListener('alchemy:view-ready',updateEntry);window.addEventListener('alchemy:opening-finished',updateEntry);
  const menus=[document.getElementById('worldBooksMenu'),document.querySelector('#mainMenuSettingsPanel .main-menu-v157__settings-actions')].filter(Boolean);
  for(const host of menus){const b=document.createElement('button');b.type='button';b.textContent='交谈回看';b.onclick=()=>{if(document.getElementById('mainMenu').hidden)runtime.showHistory();else history();};host.append(b);}
  const host=document.getElementById('worldSettings');for(const [label,fn] of [['对话设置',runtime.showSettings],['继续交谈',runtime.resumeConversation],['结束本段交谈',()=>runtime.end(false)]]){const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=()=>{document.querySelector('.world-settings-toggle[aria-expanded="true"]')?.click();fn();};host.append(b);}
  const end=document.createElement('button');end.type='button';end.textContent='结束本段交谈';end.title='结束本次交谈，下次从开头开始';end.disabled=!runtime.pending;end.onclick=()=>runtime.end(false);root.querySelector('[data-dialogue-view="settings"]').append(end);
  window.addEventListener('alchemy:dialogue-state',()=>{end.hidden=current?.kind==='opening';end.disabled=!runtime.pending;});
  if(runtime.error)$('dialogueStatus').textContent=runtime.error;updateEntry();
})();
