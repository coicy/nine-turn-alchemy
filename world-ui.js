/* === Consolidated source: journal-ui.js === */
(() => {
 const api=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,record=document.querySelector('.order-panel'),manual=document.querySelector('.side-panel');
 function book(panel,title,labels){panel.classList.add('journal-book');const original=[...panel.children].filter(n=>n.tagName!=='SUMMARY');panel.replaceChildren();if(panel.tagName==='DETAILS'){const summary=document.createElement('summary');summary.hidden=true;summary.textContent=title;panel.append(summary);}const header=document.createElement('header');header.className='journal-heading';header.innerHTML='<h2>'+title+'</h2>';const nav=document.createElement('nav');nav.className='journal-tabs';nav.setAttribute('aria-label',title+'书页');const pages=labels.map((label,i)=>{const page=document.createElement('section');page.className='journal-page';page.hidden=i!==0;const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.focusKey=title+'-tab-'+i;b.onclick=()=>select(i);nav.append(b);return page;});function select(i){pages.forEach((p,j)=>p.hidden=i!==j);[...nav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}header.append(nav);panel.append(header,...pages);select(0);return {original,pages,select};}
 const ledger=book(record,'经营簿',['本次记录','经营概览','来客旧闻']);ledger.pages[0].append(...ledger.original);ledger.pages[0].querySelectorAll('.deferred-note').forEach(n=>n.remove());
 const scope=document.createElement('p');scope.className='record-scope';ledger.pages[0].prepend(scope);const totals=document.createElement('div');totals.className='ledger-totals';ledger.pages[1].append(totals);
 const chroniclePage=document.createElement('div');chroniclePage.className='ledger-chronicle';ledger.pages[2].append(chroniclePage);
 const leaseLedger=document.createElement('section');
 leaseLedger.className='lease-ledger';
 leaseLedger.dataset.leaseOverview='';
 ledger.pages[1].prepend(leaseLedger);
 function renderLease(c) {
   const terms = c.lease?.terms;
   leaseLedger.hidden = !terms?.length;
   if (leaseLedger.hidden) return;
   const rows = terms.map(term => {
     const remainder = term.amount - term.paid;
     let status = '待交';
     if (!remainder) {
       status = '第 '+term.paidDay+' 天结清'+(term.paidDay > term.day+2 ? ' · 逾期' : '');
     } else if (term.day < c.day || term.day === c.day && c.phase !== 'open') {
       status = (c.day > term.day+2 || c.day === term.day+2 && c.phase !== 'open' ? '逾期尚欠 ' : '尚欠 ')+remainder+' 铜钱';
     }
     return '<li><span>第 '+term.day+' 天 · '+term.amount+' 铜钱</span><strong>'+status+'</strong></li>';
   });
   UX.html(leaseLedger,'<h3>铺契 · 邵四娘</h3><ul>'+rows.join('')+'</ul>');
 }
 function renderChronicle(c){
  const catalog=window.AlchemyCustomerCatalog?.specialArcs||{};
  const entries=Array.isArray(c.specialChronicle)?c.specialChronicle:[];
  const submittedImperial=c.specialArcs?.['imperial-gao']?.history?.some(h=>h.status==='completed');
  let html='<h3>昏君当道 · 坊间来客录</h3><p class="chronicle-intro">宫中日夜征求并不存在的长生仙丹，一道道圣旨顺着官府、税卡与戏台落下来，有人在里头熬干了骨血，也有人借着炉火浑水摸鱼。</p>';
  if(c.day>=30||c.phase==='finished'){
   const endingNote=submittedImperial
    ?'第 30 日宫中忽传大行皇帝驾崩。因本坊曾向司礼监高全交付过“奉进成丹”，内廷旧档与地方丹会名册各执一词：官档记你误用禁方在逃，坊间抄本却传你早自南城渡口隐入江湖。'
    :'第 30 日宫中忽传大行皇帝驾崩。本坊虽未曾向御前交过一粒仙丹，然征丹诏令之下无一处药铺得以置身事外，满城红绸一夜撤尽，只余这本旧账记下三十日来的人间荒唐。';
   html+=`<article class="chronicle-ending"><strong>三十日终局卷宗 · 宫门丧钟</strong><p>${endingNote}</p></article>`;
  }
  if(!entries.length){
   html+='<p class="chronicle-empty">开坊伊始，来往多是寻常散修与行商。待第四日后声名渐起，城中因圣上求仙而受苦或钻营之人，便会陆续登门。</p>';
  }else{
   html+='<div class="chronicle-list">'+entries.slice().reverse().map(item=>{
    const statusLabel=item.status==='completed'?(item.matched?'已成交 · 投其所好':'已成交'):item.status==='postscript'?'旧客捎信':item.status==='skipped'?'未接此单':'未能交丹';
    return `<article class="chronicle-entry" data-status="${item.status}"><header><strong>第 ${item.day} 天 · ${item.name}（${item.role}）</strong><span>《${item.title}》第 ${item.stage} 幕 · ${statusLabel}</span></header><p>${item.text}</p></article>`;
   }).join('')+'</div>';
  }
  html+='<h3>六位特殊来客名录</h3><div class="chronicle-roster">'+Object.values(catalog).map(arc=>{
   const st=c.specialArcs?.[arc.id],visited=st?.history?.length||0,done=st?.postscriptDelivered||st?.stage>4;
   const todayOrder=c.orders?.find(o=>o.arcId===arc.id&&['pending','active'].includes(o.status));
   const statusText=todayOrder?(todayOrder.status==='active'?`今日正在代炼（第 ${todayOrder.arcStage} 幕）`:`今日在柜前候着（第 ${todayOrder.arcStage} 幕）`):done?'四幕已结':visited?`已来访 ${visited} 次（至第 ${Math.min(4,st.stage||1)} 幕）`:'尚未登门';
   return `<article class="chronicle-card"${todayOrder?' data-present="true"':''}><strong>${arc.name} · 《${arc.title}》</strong><small>${arc.role} · ${arc.tag}</small><p>${arc.summary}</p><span>当前进度：${statusText}</span></article>`;
  }).join('')+'</div>';
  UX.html(chroniclePage,html);
 }
 const handbook=book(manual,'炉谱',['炼丹规则','本次炉讯']);const nodes=handbook.original;
 const logs=nodes.find(n=>n.id==='logList');
 const dataSource=document.createElement('section');dataSource.id='uxDataSettingsSource';dataSource.hidden=true;let data=false;for(const n of nodes){if(n.textContent==='试玩记录'){data=true;continue;}if(data)dataSource.append(n);}document.body.append(dataSource);
 handbook.pages[0].innerHTML='<h3>取料与丹药</h3><p>点药包拿起，再点炉口投入；也可拖入。点火门扇火炼化。点“收丹入匣”，再到丹匣选丹交付、出售或寄售。持物可点“放回”；电脑也可按 Esc。</p><p>投入成功才扣料。每包客料预支24文。交单按全额药力计算，炸炉免赔。成丹交易先抵料款，寄售按抵扣后的售价加价。点“交丹”才累计本单药力，达标即结单。百转后必须收丹。</p><h3 data-rules-section="probability">五类炼化结果</h3><dl class="rules-outcomes"><dt>炸炉</dt><dd>损失当前炉内丹药（造物为损失器料）。</dd><dt>受损</dt><dd>初始炉退 1 转，药力×0.7；1 级炉首伤药力×0.85；满级凝丹炉不退转，药力×0.85。</dd><dt>维持</dt><dd>保留转数与药力。</dd><dt>成功</dt><dd>升 1 转并提升药力。</dd><dt>大成功</dt><dd>升 2 转，并获得本炉药力额外 +11% 倍率加成。</dd></dl><p>五类互斥，合计100%。数字四舍五入，色带使用真实比例；保护后的实际概率以炉前窗口为准。</p><h3>符力护炉</h3><p>每手动催炼 1 次，炉腹点亮 1 枚符钉（跨炉保留）；集满 9 枚后自动展开符纸，从金色笔尖起分三笔描完敕火符，符成化为 5 团护炉符火自动连炼 5 次。护炉期间炸炉率为 0%，不重复蓄势，仍可能受损或维持；达到百转即成丹。</p><h3>九转归元与余火</h3><p>炼化使药力创本炉新高时，会按上次药力与当次炸炉风险攒入余火；丹药每跨过 9、18、27…转时触发归元，将攒下的余火结算为归元药力，收丹后一并计入提交药力与售价。受损时未兑现余火与已得归元药力会随药力同比例折损。</p><h3>铺契与采购</h3><p>邵四娘按第7、14、21、28天阶梯收取铺租（120、280、440、560文）。收工时可先付现有铜钱，欠额可在之后收工时补缴。第三周可从丹匣挑一颗药力至少120的丹交给药铺，按即时售价加20文；九转及以上改加120文，限购一颗。</p>';
 const logScope=document.createElement('p');logScope.className='log-scope';handbook.pages[1].append(logScope);if(logs)handbook.pages[1].append(logs);
 function render(){const c=api.campaign();if(!c)return;renderLease(c);renderChronicle(c);const s=api.snapshot(),e=E.ensure(c);record.dataset.recordSource=s.order?'commission':'forge';scope.textContent=s.order?'当前委托统计':'当前炼丹统计';logScope.textContent=s.order?'当前委托 · 最近8条':'当前炼丹 · 最近8条';
  UX.html(totals,'<h3>累计经营概览</h3><dl><dt>累计收入</dt><dd>'+e.earned+' 铜钱</dd><dt>累计支出</dt><dd>'+e.spent+' 铜钱</dd><dt>累计净变化</dt><dd>'+(e.earned-e.spent)+' 铜钱</dd></dl><h3>每日经营结果</h3>'+(c.history.length?c.history.slice().reverse().map(d=>'<article class="ledger-day"><strong>第 '+d.day+' 天</strong><p>完成 '+d.completed+' · 未完成委托 '+d.failed+' · 未接跳过 '+(d.skipped??'未记录')+'</p><p>委托收入 '+(d.commissionIncome===undefined?'未记录':d.commissionIncome+' 铜钱')+' · 赠药 '+(d.gifted===undefined?'未记录':d.gifted+' 包'+(d.pouchBonus?' + 余料囊 '+d.pouchBonus+' 包':''))+'</p>'+(d.rent?'<p>交铺租 '+d.rent.payment+' 铜钱'+(d.rent.remaining?' · 余欠 '+d.rent.remaining+' 铜钱':'')+'</p>':'')+'</article>').join(''):'<p>尚未日结</p><button data-ledger-counter>回柜台</button>'));
 }
 totals.addEventListener('click',e=>{if(e.target.closest('[data-ledger-counter]'))window.AlchemyViewState.navigate('orders');});
 window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view==='record'&&e.detail.context?.chapter==='lease'){ledger.select(1);requestAnimationFrame(()=>leaseLedger.scrollIntoView({block:'start'}));}if(e.detail.view==='record'&&e.detail.context?.chapter==='chronicle'){ledger.select(2);requestAnimationFrame(()=>chroniclePage.scrollIntoView({block:'start'}));}if(e.detail.view==='manual'){handbook.select(0);if(e.detail.context?.chapter==='probability')requestAnimationFrame(()=>handbook.pages[0].querySelector('[data-rules-section=probability]')?.scrollIntoView({block:'start'}));}});window.addEventListener('alchemy:render',render);render();
})();
;
/* === Consolidated source: consignment-ui.js === */
(() => {
  const game = window.AlchemyGame;
  const economy = window.AlchemyEconomy;
  const board = document.querySelector('.order-panel .journal-page:last-child');
  if (!game || !economy || !board) return;
  const panel = document.createElement('section');
  panel.className = 'consignment-board-v158';
  panel.setAttribute('aria-live', 'polite');
  board.prepend(panel);
  const phone = matchMedia('(max-width: 650px)');
  const disclosure = document.createElement('details');
  const summary = document.createElement('summary');
  const list = document.createElement('ul');
  const heading = document.createElement('div');
  heading.className = 'consignment-heading';
  disclosure.append(summary);
  function layout() {
    if (phone.matches) {
      disclosure.open = false;
      disclosure.append(list);
      panel.replaceChildren(disclosure);
    } else panel.replaceChildren(heading, list);
  }
  layout();
  phone.addEventListener('change', layout);


  function render() {
    const campaign = game.campaign();
    if (!campaign) { panel.hidden = true; return; }
    if (panel.parentElement !== board) board.prepend(panel);
    const e = economy.ensure(campaign);
    const listed = (e.consignments || []).filter(x => x?.status === 'listed' && x.pillSnapshot);
    const paid = (e.consignments || []).filter(x => x?.status === 'paid' && x.pillSnapshot).slice(-3).reverse();
    const rows = listed.map(x => `<li><strong>${x.pillSnapshot.turn}转 · 药力 ${economy.grossValue(x.pillSnapshot)}</strong><span>${x.tierName} · 第${x.settleDay}天回款 ${x.guaranteedPayout} 铜钱</span></li>`).join('');
    const paidRows = paid.map(x => `<li><strong>第${x.paidDay}天已到账</strong><span>${x.guaranteedPayout} 铜钱 · ${x.tierName}</span></li>`).join('');
    panel.hidden = !listed.length && !paid.length;
    summary.textContent = listed.length ? `寄售中 ${listed.length}/3` : '最近寄售回款';
    heading.innerHTML = '<strong>' + summary.textContent + '</strong><span>' +
      (listed.length ? '回款按丹药快照结算' : '可继续查看丹匣') + '</span>';
    list.innerHTML = listed.length ? rows : paidRows;

  }

  window.addEventListener('alchemy:render', render);
  window.addEventListener('alchemy:interaction', render);
  window.addEventListener('alchemy:view-ready', render);
  render();
})();
;
/* === Consolidated source: counter-people.js === */
(() => {
 const board=document.querySelector('.counter-board');if(!board)return;
 // Use the same cover transform as the 1672 × 941 counter painting.
 function fit(){const w=board.clientWidth,h=board.clientHeight;if(!w||!h)return;const scale=Math.max(w/1672,h/941);board.style.setProperty('--counter-scale',scale+'px');board.style.setProperty('--counter-origin-x',(w-1672*scale)/2+'px');board.style.setProperty('--counter-origin-y',(h-941*scale)/2+'px');}
 new ResizeObserver(fit).observe(board);fit();
})();
;
/* === Consolidated source: onboarding.js === */
(() => {
 const api=window.AlchemyGame,UX=window.AlchemyUX,observation=document.querySelector('.room-observation');
 const details=document.createElement('details');details.className='observation-details';details.innerHTML='<summary>查看丹药</summary>';observation.append(details);
 const panel=document.createElement('section');panel.className='pill-detail-panel';panel.setAttribute('aria-label','丹药详情');document.querySelector('.game-layout').append(panel);window.AlchemyViewState.register('pill',panel,{short:true});
 details.querySelector('summary').onclick=e=>{e.preventDefault();window.AlchemyViewState.navigate('pill',{anchor:document.querySelector('.observation-pill')});};
 panel.addEventListener('click',e=>{if(e.target.closest('[data-close-pill]'))window.AlchemyViewState.close();});
 // Action guidance is attached to the real objects by furnace-guidance.js.
 function instruction(){return '';}
 function update(){const s=api.snapshot();
  document.body.classList.remove('guided-journey','guided-opening','journey-orders','journey-shop','journey-tools');
  const rawNature=window.AlchemyPillArt?.describe?window.AlchemyPillArt.describe(s).nature:s.nature;const nature={warm:'温性',cool:'寒性',neutral:'平性'}[rawNature||s.nature]||'平性';const potency=Number.isFinite(s.grossValue)?s.grossValue:Math.round(s.value+(s.yuanBonus||0));
  UX.html(panel,'<header><h2>'+(s.craftKind?window.AlchemyCrafts.name(s):'丹药')+'</h2><button data-close-pill data-focus-key="close-pill">合上 ×</button></header><div class="pill-observe-art">'+UX.art(s)+'</div><p>'+s.turn+'转 · '+(s.craftKind?'自购器料 · 估值 ':['凡品','良品','上品','极品','绝品'][s.quality]+' · '+nature+' · 药力 ')+potency+((!s.craftKind&&(s.yuanBonus||0)>0)?'（含归元 +'+Math.round(s.yuanBonus)+'）':'')+'</p>');
  details.hidden=s.pillEnded||s.roundEnded;
  const hint=document.getElementById('workInstruction');if(hint){hint.textContent=UX.instruction(s,window.AlchemyScene2D?.held);hint.hidden=!hint.textContent;}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 window.AlchemyOnboarding={instruction};window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);update();
})();
;
/* === Consolidated source: save-slots-ui.js === */
(() => {
 const saves=window.AlchemySaves,api=window.AlchemyGame,UX=window.AlchemyUX,dialog=document.createElement('dialog');dialog.className='save-picker';dialog.id='savePicker';dialog.setAttribute('aria-labelledby','savePickerTitle');dialog.innerHTML='<header><h2 id="savePickerTitle">存档</h2><button type="button" data-close>关闭</button></header><div class="save-slot-list"></div><p id="savePickerNotice" role="status"></p><small>进度自动保存在当前浏览器。</small>';document.body.append(dialog);
 const notice=document.createElement('p');notice.className='save-notice';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);const buttons=[];let confirmId=null,origin=null;
 const busy=()=>window.AlchemyOpening?.active||api.snapshot().busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy||!!window.AlchemyScene2D?.held;
 function close(){confirmId=null;dialog.close();UX.restore(origin,document.querySelector('.world-location-toggle'));}
 function open(){if(busy())return;confirmId=null;origin=UX.focusKey(document.activeElement);render();dialog.showModal();dialog.querySelector('[data-close]').focus();}
 for(const host of [document.querySelector('.opening-launch'),document.querySelector('.engine-nav')]){const b=document.createElement('button');b.type='button';b.className='save-open';b.setAttribute('aria-controls','savePicker');b.dataset.focusKey=host.classList.contains('opening-launch')?'title-saves':'settings-saves';b.onclick=open;host.append(b);buttons.push(b);}
 function render(){const locked=!!busy();buttons.forEach(b=>{b.textContent='存档 '+saves.active;b.disabled=locked;});notice.hidden=!saves.error;notice.textContent=saves.error;const playing=document.body.dataset.screen==='playing';
  UX.html(dialog.querySelector('.save-slot-list'),[1,2,3].map(id=>{const entry=saves.slot(id),d=entry.data,current=id===saves.active,order=d?d.campaign.orders.find(o=>o.id===d.state.orderId&&o.status==='active'):null,summary=d?(d.campaign.phase==='finished'?'经营已结束':order?order.name+' · 已交 '+Math.round(d.state.delivered)+' / '+order.target:d.state.pillEnded?'丹药已入丹匣':'炉中有丹'):'待接客';
   return '<article class="save-slot"><h3>存档 '+id+(d&&current?' · 当前':'')+'</h3><p>'+(entry.corrupt?'无法读取，原始数据已保留':d?'第 '+d.campaign.day+' 天 · '+(d.campaign.economy?.coins||0)+' 铜钱':'空存档')+'</p>'+(summary?'<p>'+UX.esc(summary)+'</p>':'')+(d&&entry.updatedAt?'<small>保存于 '+UX.esc(new Date(entry.updatedAt).toLocaleString('zh-CN'))+'</small>':'')+(confirmId===id?'<div class="save-reset-confirm"><p>清空存档 '+id+' 的经营进度并重新开局；其他存档不变。</p><button data-confirm-reset="'+id+'">确认清空并重开</button><button data-cancel-reset="'+id+'">取消</button></div>':'<div class="save-actions"><button data-slot="'+id+'" '+(locked||entry.corrupt?'disabled':'')+'>'+(d?(current&&playing?'返回当前游戏':'载入此存档'):'新开丹坊')+'</button>'+((d||entry.corrupt)?'<button class="save-reset" data-reset="'+id+'" '+(locked?'disabled':'')+'>重新开局</button>':'')+'</div>')+'</article>';}).join(''));dialog.querySelector('#savePickerNotice').textContent=saves.error;
 }
 dialog.addEventListener('click',e=>{if(e.target.closest('[data-close]')){close();return;}if(busy())return;const cancel=e.target.closest('[data-cancel-reset]');if(cancel){confirmId=null;render();dialog.querySelector('[data-reset="'+cancel.dataset.cancelReset+'"]')?.focus();return;}const reset=e.target.closest('[data-reset]');if(reset){confirmId=Number(reset.dataset.reset);render();dialog.querySelector('[data-cancel-reset]')?.focus();return;}const confirmed=e.target.closest('[data-confirm-reset]'),use=e.target.closest('[data-slot]');if(!confirmed&&!use)return;const id=Number(confirmed?confirmed.dataset.confirmReset:use.dataset.slot);if(confirmed){if(confirmId!==id||!saves.reset(id)){render();return;}}else if(id===saves.active&&document.body.dataset.screen==='playing'){close();return;}if(saves.select(id))location.reload();else render();});
 dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();if(confirmId!==null){confirmId=null;render();dialog.querySelector('[data-close]').focus();}else close();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});window.addEventListener('alchemy:view-ready',()=>{if(dialog.open)close();});window.addEventListener('alchemy:opening-finished',render);window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);window.addEventListener('alchemy:fanning',()=>{queueMicrotask(render);setTimeout(render,1000);});render();
})();
;
/* === Consolidated source: commission-motion.js === */
(() => {
  'use strict';
  const note=document.getElementById('counterNote'),letter=document.getElementById('counterLetter');
  if(!note||!letter)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),running=new Map();
  let lastNote=false,lastLetter=false,frame=0,disposed=false;
  function motion(el,frames,duration){
    running.get(el)?.cancel();running.delete(el);
    if(!window.AlchemyOpening?.active||reduced.matches||document.hidden||!el.animate)return;
    const a=el.animate(frames,{duration,easing:'cubic-bezier(.18,.75,.25,1)',fill:'none'});running.set(el,a);
    a.finished.then(()=>{if(running.get(el)===a)running.delete(el);}).catch(()=>{});
  }
  function clear(){for(const a of running.values())a.cancel();running.clear();}
  function visible(el){return !el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';}
  function update(){
    frame=0;if(disposed)return;
    const board=document.querySelector('.counter-board');
    const inCounter=board?.dataset.shellActive==='true'&&window.AlchemyViewState?.snapshot().phase==='idle';
    const n=inCounter&&visible(note),l=inCounter&&visible(letter);
    if(n&&!lastNote&&!l&&note.dataset.noteArt==='image')motion(note,[{opacity:0,translate:'0 -14px',rotate:'-2deg'},{opacity:1,translate:'0 1px',rotate:'.3deg',offset:.78},{opacity:1,translate:'0 0',rotate:'0deg'}],320);
    if(l&&!lastLetter)motion(letter,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 -1px',offset:.82},{opacity:1,translate:'0 0'}],240);
    if(!l&&lastLetter&&n)motion(note,[{opacity:.3,translate:'0 -3px'},{opacity:1,translate:'0 0'}],160);
    lastNote=n;lastLetter=l;
    if(!inCounter){running.get(note)?.cancel();running.get(letter)?.cancel();}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  const observer=new MutationObserver(schedule);
  observer.observe(note,{attributes:true,attributeFilter:['hidden','aria-expanded','data-note-art']});
  observer.observe(letter,{attributes:true,attributeFilter:['hidden'],childList:true});
  for(const event of ['resize','alchemy:view-ready'])window.addEventListener(event,schedule);
  window.addEventListener('alchemy:opening-finished',()=>{clear();schedule();});
  document.addEventListener('visibilitychange',()=>{clear();schedule();});
  reduced.addEventListener('change',()=>{clear();schedule();});
  window.addEventListener('pagehide',()=>{disposed=true;clear();cancelAnimationFrame(frame);observer.disconnect();});
  window.AlchemyCommissionMotion={snapshot:()=>({active:running.size,reduced:reduced.matches})};schedule();
})();
;
/* === Consolidated source: refine-odds.js === */
(() => {
 const api=window.AlchemyGame,stage=document.getElementById('pillStage'),toggle=document.createElement('button');toggle.type='button';toggle.className='refine-odds-toggle';toggle.textContent='展开五类概率';toggle.setAttribute('aria-controls','refineOdds');
 const panel=document.createElement('aside');panel.id='refineOdds';panel.className='refine-odds';panel.setAttribute('aria-labelledby','refineOddsTitle');panel.innerHTML='<header><h2 id="refineOddsTitle">下一次炼化</h2><button type="button" aria-label="收起炼丹概率窗口">收起 ×</button></header><p id="refineOddsState"></p><p id="refineOddsRisk" class="refine-odds-risk"></p><dl></dl><div class="chance-bar" aria-hidden="true"></div><div class="odds-charge-strip" hidden></div><p id="refineOddsProtection" class="refine-odds-protection"></p><button class="odds-rules" data-focus-key="odds-rules" type="button">查阅炼化概率</button>';
 const definitions=[['explode','炸炉'],['damage','受损'],['hold','维持'],['success','成功'],['big','大成功']],rows=definitions.map(([id,label])=>{const row=document.createElement('div');row.dataset.outcome=id;row.innerHTML='<dt>'+label+'</dt><dd></dd>';panel.querySelector('dl').append(row);const segment=document.createElement('span');segment.className='chance-segment';segment.dataset.outcome=id;panel.querySelector('.chance-bar').append(segment);return {id,row,value:row.querySelector('dd'),segment};});
 stage.append(panel,toggle);let open=true,pillKey='',lastOutcome=null,timer;
 function riskCopy(p,s){
  if(!p.available)return '';
  const charge=`步罡蓄势 ${s?.ritualCharge??0}/${s?.ritualChargeTarget||9}`;
  if(p.safeRun)return `动作前炉险 ${(p.baseExplosion*100).toFixed(1)}% · 符火护炉，自动连炼剩余${p.safeRefines}次 · 最终炸炉 0.0%`;
  if(p.protection)return `动作前炉险 ${(p.baseExplosion*100).toFixed(1)}% · 保护后炸炉 ${(p.outcomes.explode*100).toFixed(1)}% · ${charge}`;
  return `${charge}`;
 }
 function protectionCopy(p){
  if(!p.available||!p.protection)return '';
  if(p.safeRun)return `本次不会炸炉 · ${p.protection.name}待命`;
  return `${p.protection.name}：炸炉转为${p.protection.outcome==='damage'?'受损':'维持'}`;
 }
 function update(){const s=api.snapshot(),p=api.refinementProbabilities(),key=s.orderId+':'+s.attempt;if(key!==pillKey){pillKey=key;open=true;lastOutcome=null;}if(s.busy)lastOutcome=null;
  const atWork=window.AlchemyViewState.snapshot().current==='work'&&window.AlchemyViewState.snapshot().workMode==='furnace',live=s.started&&!s.pillEnded&&!s.roundEnded,visible=live&&atWork&&p.available;
  toggle.hidden=!visible||open;panel.hidden=!visible||!open;toggle.setAttribute('aria-expanded',String(visible&&open));document.body.classList.toggle('odds-expanded',visible&&open);
  panel.querySelector('#refineOddsState').textContent=s.endReason==='explode'?'本炉炸炉':s.busy?'本次结算中…':'';
  const risk=panel.querySelector('#refineOddsRisk'),protection=panel.querySelector('#refineOddsProtection'),chargeStrip=panel.querySelector('.odds-charge-strip');
  let topId='success',topProb=0;
  if(p.available){rows.forEach(({id})=>{const pr=p.outcomes[id]||0;if(pr>topProb){topProb=pr;topId=id;}});}
  rows.forEach(({id,row,value,segment})=>{value.textContent=p.available?(p.outcomes[id]*100).toFixed(1)+'%':'—';segment.style.width=(p.available?p.outcomes[id]*100:0)+'%';row.removeAttribute('data-hit');row.dataset.top=(p.available&&topProb>0&&id===topId)?'true':'false';});
  const desktopWarm=innerWidth>650&&document.body.classList.contains('warm-cinnabar-experiment');
  if(desktopWarm&&p.available){
   const charge=s?.ritualCharge??0,target=s?.ritualChargeTarget||9;
   let pips='';for(let i=0;i<target;i++)pips+='<i class="odds-pip'+(i<charge?' is-on':'')+'"></i>';
   chargeStrip.innerHTML='<span>步罡蓄势 <b>'+charge+'/'+target+'</b></span><div class="odds-charge-pips" aria-hidden="true">'+pips+'</div>';
   chargeStrip.hidden=false;risk.hidden=true;
   if(p.safeRun)protection.textContent=(p.protection?p.protection.name+'待命 · ':'')+'符火护炉，自动连炼余 '+p.safeRefines+' 次（炸炉 0.0%）';
   else if(p.protection)protection.textContent=p.protection.name+'：炸炉转'+(p.protection.outcome==='damage'?'受损':'维持')+' · 原炉险 '+(p.baseExplosion*100).toFixed(1)+'%';
   else protection.textContent='';
   protection.hidden=!protection.textContent;
  }else{
   chargeStrip.hidden=true;
   risk.textContent=riskCopy(p,s);risk.hidden=!risk.textContent;
   protection.textContent=protectionCopy(p);protection.hidden=!protection.textContent;
  }
  toggle.textContent='展开五类概率';
  let toggleRisk=toggle.querySelector('small');if(!toggleRisk){toggleRisk=document.createElement('small');toggle.append(toggleRisk);}toggleRisk.textContent=p.available?'炉险 '+(p.baseExplosion*100).toFixed(1)+'% · 炸炉 '+(p.outcomes.explode*100).toFixed(1)+'%'+(p.safeRun?' · 符火连炼余'+p.safeRefines:` · 蓄势 ${s.ritualCharge??0}/${s.ritualChargeTarget||9}`):'';
  const narrow=innerWidth<=650,host=document.querySelector('.furnace-judgment')||(narrow?document.body:stage);for(const el of [panel,toggle]){if(el.parentElement!==host)host.append(el);el.classList.toggle('mobile-odds',narrow);}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 toggle.onclick=()=>{open=true;update();panel.querySelector('button').focus({preventScroll:true});};panel.querySelector('header button').onclick=()=>{open=false;update();toggle.focus({preventScroll:true});};
 panel.querySelector('.odds-rules').onclick=()=>window.AlchemyViewState.navigate('manual',{anchor:panel.querySelector('.odds-rules'),chapter:'probability'});
 // Five exact probabilities remain visible while another refinement is possible.
 window.addEventListener('alchemy:refine-result',e=>{lastOutcome=e.detail.outcome;clearTimeout(timer);update();if(lastOutcome!=='explode')timer=setTimeout(()=>{lastOutcome=null;update();},1800);});
 window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:view-ready',update);window.addEventListener('resize',update);update();
})();
;
/* === Consolidated source: information-ui.js === */
(() => {
  'use strict';
  const stage=document.getElementById('pillStage'),observation=document.querySelector('.room-observation'),settlement=document.getElementById('roomSettlement'),herbs=document.querySelector('.herb-tray'),instruction=document.getElementById('workInstruction');
  const surfaces=[observation,settlement,herbs,instruction];
  const preview=observation.querySelector('.observation-pill');
  preview.removeAttribute('aria-hidden');preview.setAttribute('role','button');preview.tabIndex=0;preview.setAttribute('aria-label','拿起丹药，放入收丹盘');
  let drag=null,queued=false,lastView=window.AlchemyViewState.snapshot().current;
  preview.addEventListener('pointerdown',e=>{if(e.button!==0||!window.AlchemyScene2D.takePill(e))return;e.preventDefault();preview.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false};});
  preview.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;window.AlchemyScene2D.movePill(e);});
  preview.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)window.AlchemyScene2D.dropPill(e);});
  preview.addEventListener('pointercancel',()=>{drag=null;window.AlchemyScene2D.cancel();});
  preview.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();const r=preview.getBoundingClientRect();if(window.AlchemyScene2D.takePill({clientX:r.x+r.width/2,clientY:r.y+r.height/2}))document.getElementById('alchemyScene').focus();});
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fit();});}
  function fit(){
    if(window.AlchemyWorldUI){window.AlchemyWorldUI.fitReading();return;}
    const mobile=innerWidth<=650,s=window.AlchemyGame.snapshot(),atWork=window.AlchemyViewState.snapshot().current==='work';
    document.body.classList.toggle('info-at-work',atWork);

    const top=document.querySelector('.engine-nav').getBoundingClientRect().bottom+8;
    document.body.style.setProperty('--info-top',top+'px');
    for(const el of surfaces){const host=mobile?document.body:stage;if(el.parentElement!==host)host.append(el);el.classList.toggle('mobile-info',mobile);}
    instruction.hidden=!instruction.textContent.trim()||s.roundEnded;
    preview.setAttribute('aria-disabled',String(s.busy||s.pillEnded));
    if(!mobile||!atWork){document.body.style.setProperty('--work-reserve','0px');return;}
    const odds=document.getElementById('refineOdds'),toggle=document.querySelector('.refine-odds-toggle');
    const oddsTop=!observation.hidden?observation.getBoundingClientRect().bottom+8:top;
    for(const el of [odds,toggle])el.style.top=oddsTop+'px';
    let bottom=top;
    for(const el of [observation,settlement,herbs,odds,toggle])if(el.checkVisibility()&&getComputedStyle(el).display!=='none')bottom=Math.max(bottom,el.getBoundingClientRect().bottom);
    const reserve=Math.min(innerHeight*.5,Math.max(0,bottom-top+16));
    document.body.style.setProperty('--work-reserve',reserve+'px');
  }
  window.addEventListener('alchemy:reserve-select',()=>{document.body.classList.add('selecting-reserve');schedule();});
  window.addEventListener('alchemy:order',()=>{document.body.classList.remove('selecting-reserve');schedule();});
  window.addEventListener('alchemy:view-ready',e=>{const c=window.AlchemyGame.campaign(),s=window.AlchemyGame.snapshot();if(e.detail.view==='work'&&lastView==='shop'&&s.roundEnded&&(c?.economy?.stock?.some(n=>n>0)||Object.values(c?.economy?.herbs||{}).some(n=>n>0)))document.body.classList.add('selecting-reserve');lastView=e.detail.view;schedule();});
  for(const name of ['alchemy:render','alchemy:interaction','alchemy:view-ready','resize'])window.addEventListener(name,schedule);
  const observer=new ResizeObserver(schedule);[observation,settlement,herbs,document.getElementById('refineOdds'),document.querySelector('.engine-nav')].forEach(el=>observer.observe(el));
  new MutationObserver(schedule).observe(instruction,{childList:true});
  document.addEventListener('toggle',schedule,true);fit();
})();
;
/* === Consolidated source: world-ui.js === */
/* Object affordances and short reading surfaces; business state stays in AlchemyGame. */
(() => {
'use strict';
const api=window.AlchemyGame,E=window.AlchemyEconomy,stage=document.getElementById('pillStage'),viewport=document.querySelector('.engine-viewport'),observation=document.querySelector('.room-observation');
const readout=document.createElement('section');readout.className='world-readout';readout.setAttribute('aria-label','本炉判断');viewport.append(readout);
const emptyReadout=document.createElement('section');emptyReadout.className='world-empty-readout';emptyReadout.hidden=true;emptyReadout.setAttribute('aria-label','当前备料');viewport.append(emptyReadout);
for(const selector of ['#roomFacts','#roomDecision','#roomStock']){const el=observation.querySelector(selector);if(el)readout.append(el);}observation.querySelector('h2').textContent='炉胆 · 局部剖视';
const caption=document.createElement('span');caption.className='world-section-caption';caption.textContent='';caption.hidden=true;observation.append(caption);
const row=document.createElement('div');row.className='world-tool-row';row.setAttribute('aria-label','案后法器');stage.append(row);
const bag=document.createElement('button');bag.className='world-casket';bag.dataset.focusKey='world-casket';bag.setAttribute('aria-label','打开收纳匣');bag.innerHTML='<img src="'+(window.AlchemyWarmProps?.props.casket.src||'assets/object-world/casket.webp')+'" alt=""><span>收纳匣</span><small></small>';bag.onclick=()=>window.AlchemyViewState.navigate('bag',{anchor:bag});stage.append(bag);
const seal=document.createElement('div');seal.className='world-delivery-seals';seal.setAttribute('aria-label','本单提交凭据');stage.append(seal);
const books=document.createElement('div');books.className='world-books';books.innerHTML='<button data-world-view="record">经营簿</button><button data-world-view="manual">炉谱</button>';stage.append(books);
const bookRest=document.createElement('div');bookRest.className='world-book-rest';bookRest.setAttribute('aria-hidden','true');bookRest.innerHTML='<i class="rest-post"></i><i class="rest-brace"></i><i class="rest-stud rest-stud-top"></i><i class="rest-stud rest-stud-bottom"></i>';stage.append(bookRest);
const portals=[];
function portal(host,label,view,cls){const b=document.createElement('button');b.className='world-passage '+cls;b.dataset.worldView=view;b.textContent=label;b.setAttribute('aria-label',label);host.append(b);portals.push(b);return b;}
portal(stage,'前堂 ›','orders','passage-counter');
const counter=document.querySelector('.counter-board');
portal(counter,'回炉 ›','work','passage-forge');
// The rear courtyard is a fixed-view route; its wooden portal remains distinct from stock.
const visitor=document.getElementById('counterVisitor');function syncBubble(){counter.querySelectorAll('.visitor-dialogue').forEach(el=>el.remove());}new MutationObserver(syncBubble).observe(visitor,{childList:true});syncBubble();

for(const host of [counter]){const b=document.createElement('div');b.className='world-books';b.innerHTML='<button data-world-view="record">经营簿</button><button data-world-view="manual">炉谱</button>';host.append(b);}
document.addEventListener('click',e=>{const b=e.target.closest('[data-world-view]');if(b)window.AlchemyViewState.navigate(b.dataset.worldView,{anchor:b});});
const bell=document.getElementById('settleDay');bell.classList.add('world-day-bell');bell.textContent='敲铃 · 结束今日';
const settings=document.getElementById('worldSettings');for(const el of [...document.querySelector('.engine-nav').children])if(!el.matches('.world-location-toggle,#worldLocationMenu,.world-catalog-toggle,#worldCatalogMenu,.world-books-toggle,#worldBooksMenu,#engineWallet,.world-settings-toggle,#worldSettings'))settings.append(el);
let placements=[null,null,null],triggerKey='',lastBagCount=0;
function decorateTools(root){root.querySelectorAll('[data-tool-art]').forEach(el=>window.AlchemyDecorateTool(el,el.dataset.toolArt));}
function syncPlaces(ids){placements=placements.map(id=>ids.includes(id)?id:null);for(const id of ids)if(!placements.includes(id)){const i=placements.indexOf(null);if(i>=0)placements[i]=id;}}
function update(){const s=api.snapshot(),c=api.campaign();if(!c)return;stage.dataset.worldOrderSource=s.order?'commission':'reserve';const e=E.ensure(c),ids=E.equippedIds(e.equipped),oldFocus=document.activeElement?.dataset?.worldTool;
 syncPlaces(ids);row.replaceChildren();placements.forEach((id,i)=>{const tool=E.TOOL_DEFS.find(t=>t.id===id),b=document.createElement('button');b.dataset.worldTool=id||'empty-'+i;const flat=id&&/^(ward|phoenix|steady_talisman|reverse_fire|stock_talisman|cooling_tag|market_tag|ash_contract|failed_contract|client_contract|consign_plate|broken_link)$/.test(id)?' tool-flat':'';b.className='world-placed-tool '+(id&&/needle|guide/.test(id)?'tool-needle':id&&/mirror|fusion|six|stone/.test(id)?'tool-stand':'tool-cushion')+flat;b.setAttribute('aria-label',tool?'查看'+tool.name:'布置法器');b.innerHTML=(tool?'<span data-tool-art="'+id+'"></span><small>'+tool.name+'</small>':'<span class="world-empty-rest"></span><small>布置</small>');b.onclick=()=>window.AlchemyEquipmentView.inspect(id,b);row.append(b);});decorateTools(row);
 if(oldFocus)row.querySelector('[data-world-tool="'+oldFocus+'"]')?.focus({preventScroll:true});
 const count=e.pills?.length||0;bag.querySelector('span').textContent=count?'收纳匣 · '+count:'收纳匣';bag.querySelector('small').textContent='';bag.setAttribute('aria-label','打开收纳匣，共'+count+'件');bag.dataset.filled=String(count>0);lastBagCount=count;
 seal.textContent=s.order&&s.collected.length?'已交 '+s.collected.length+' 丹 · '+Math.round(s.delivered)+' 药力':'';
 readout.hidden=!s.started||s.pillEnded||s.roundEnded;readout.dataset.live=String(!s.pillEnded&&!s.roundEnded);
 emptyReadout.hidden=!s.started||!s.pillEnded||s.roundEnded;
 if(!emptyReadout.hidden){emptyReadout.replaceChildren();const title=document.createElement('strong'),detail=document.createElement('span');title.textContent=s.order?s.order.name:'储备药材';detail.textContent=s.order?`本单余料 ${s.remaining} 包 · 已交 ${Math.round(s.delivered)} / ${s.target}`:'选取药材后开炉，成丹统一收入丹匣';emptyReadout.append(title,detail);}
 const key=s.orderId+':'+s.attempt+':'+s.turn+':'+s.toolProgress.triggers.join('|');
 if(triggerKey&&key!==triggerKey&&s.toolProgress.triggers.length){for(const t of E.TOOL_DEFS)if(s.toolProgress.triggers.some(text=>text.includes(t.name))){const b=row.querySelector('[data-world-tool="'+t.id+'"]');if(b&&!matchMedia('(prefers-reduced-motion: reduce)').matches)b.animate([{filter:'brightness(1)'},{filter:'brightness(1.8)'},{filter:'brightness(1)'}],{duration:240});}}
 triggerKey=key;window.AlchemyWorldLayout.fit();
}
function fitReading(){window.AlchemyWorldLayout.fit();const s=api.snapshot(),atWork=window.AlchemyViewState.snapshot().location==='work';document.body.classList.toggle('info-at-work',atWork);for(const selector of ['#roomSettlement','#workInstruction','.herb-tray']){if(selector==='.herb-tray'&&window.AlchemySceneContinuity)continue;const el=document.querySelector(selector);if(el&&el.parentElement!==stage)stage.append(el);el?.classList.remove('mobile-info');}observation.classList.remove('mobile-info');if(observation.parentElement!==stage)stage.append(observation);const hint=document.getElementById('workInstruction');hint.hidden=!hint.textContent.trim()||(s.roundEnded&&!window.AlchemyScene2D?.held);}
window.AlchemyWorldUI={decorateTools,fitReading};
window.addEventListener('alchemy:equipment-replaced',e=>{const i=placements.indexOf(e.detail.oldId);if(i>=0)placements[i]=e.detail.newId;update();});
window.addEventListener('alchemy:view-ready',e=>{fitReading();});
window.addEventListener('alchemy:order',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)document.querySelector('.herb-tray')?.animate([{filter:'brightness(1)'},{filter:'brightness(1.4)'},{filter:'brightness(1)'}],{duration:400});});
window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:world-layout',fitReading);
window.addEventListener('alchemy:world-collect',()=>{if(!matchMedia('(prefers-reduced-motion: reduce)').matches)bag.animate([{transform:'scale(1)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:400});});
window.addEventListener('alchemy:refine-result',e=>{stage.dataset.worldResult=e.detail.outcome;setTimeout(()=>{stage.dataset.worldResult='';},700);});
window.addEventListener('alchemy:carry',e=>{document.body.dataset.worldCarry=e.detail.kind||'';});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!e.defaultPrevented&&window.AlchemyScene2D.held){e.preventDefault();window.AlchemyScene2D.cancel();return;}const details=observation.querySelector('details[open]');if(e.key==='Escape'&&details){e.preventDefault();details.open=false;details.querySelector('summary').focus();}});
// Bag/market content may have been built before the decorator existed.
decorateTools(document);fitReading();update();
})();
;
/* === Consolidated source: ui-settings.js === */
(() => {
 const UX=window.AlchemyUX,source=document.getElementById('uxDataSettingsSource'),dialog=document.createElement('dialog');dialog.className='ux-data-settings';dialog.setAttribute('aria-labelledby','uxDataTitle');dialog.innerHTML='<header><h2 id="uxDataTitle">试玩数据设置</h2><button data-close-data>关闭</button></header>';document.body.append(dialog);source.hidden=false;dialog.append(source);
 const intro=document.getElementById('introTelemetryEnabled'),main=document.getElementById('telemetryEnabled');let origin=null;
 function openData(){origin=UX.focusKey(document.activeElement);dialog.showModal();dialog.querySelector('[data-close-data]').focus();}
 function closeData(){dialog.close();UX.restore(origin,document.querySelector('.world-settings-toggle'));}
 main.addEventListener('change',()=>{intro.checked=main.checked;});intro.addEventListener('change',()=>{main.checked=intro.checked;main.dispatchEvent(new Event('change'));});intro.checked=main.checked;
 dialog.querySelector('[data-close-data]').onclick=closeData;dialog.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeData();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
 for(const [host,key]of[[document.querySelector('.opening-launch'),'title-data'],[document.getElementById('worldSettings'),'settings-data']]){const b=document.createElement('button');b.type='button';b.dataset.focusKey=key;b.className='ux-data-open';b.textContent='试玩数据设置';b.onclick=openData;host.append(b);}
 document.querySelector('.opening-consent').hidden=true;document.querySelector('.opening-prose').hidden=true;document.querySelector('.opening-tagline').textContent='一炉烟火，百转成丹。';
 const help=document.querySelector('.opening-help');help.innerHTML='<summary>试炉要诀</summary><ol><li>取一包药。</li><li>投入炉口，点火门炼化。</li><li>收丹入匣，再选择交丹、出售或寄售。</li></ol><button data-title-rules data-focus-key="title-rules">查阅详细要诀</button>';
 const rules=document.createElement('dialog');rules.className='ux-title-rules';rules.innerHTML='<header><h2>试炉要诀</h2><button data-close-rules>关闭</button></header><div></div>';document.body.append(rules);
 help.querySelector('button').onclick=()=>{origin=UX.focusKey(document.activeElement);const page=document.querySelector('.side-panel .journal-page:first-of-type');rules.querySelector('div').innerHTML=page?.innerHTML||'';rules.showModal();rules.querySelector('button').focus();};
 const closeRules=()=>{rules.close();UX.restore(origin,help.querySelector('summary'));};rules.querySelector('button').onclick=closeRules;rules.addEventListener('cancel',e=>{e.preventDefault();e.stopPropagation();closeRules();});rules.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
})();
