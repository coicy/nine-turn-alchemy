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
