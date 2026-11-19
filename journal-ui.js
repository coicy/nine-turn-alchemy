(() => {
 const api=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,record=document.querySelector('.order-panel'),manual=document.querySelector('.side-panel');
 function book(panel,title,labels){panel.classList.add('journal-book');const original=[...panel.children].filter(n=>n.tagName!=='SUMMARY');panel.replaceChildren();if(panel.tagName==='DETAILS'){const summary=document.createElement('summary');summary.hidden=true;summary.textContent=title;panel.append(summary);}const header=document.createElement('header');header.className='journal-heading';header.innerHTML='<h2>'+title+'</h2>';const nav=document.createElement('nav');nav.className='journal-tabs';nav.setAttribute('aria-label',title+'书页');const pages=labels.map((label,i)=>{const page=document.createElement('section');page.className='journal-page';page.hidden=i!==0;const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.focusKey=title+'-tab-'+i;b.onclick=()=>select(i);nav.append(b);return page;});function select(i){pages.forEach((p,j)=>p.hidden=i!==j);[...nav.children].forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));}header.append(nav);panel.append(header,...pages);select(0);return {original,pages,select};}
 const ledger=book(record,'经营簿',['本次记录','经营概览']);ledger.pages[0].append(...ledger.original);ledger.pages[0].querySelectorAll('.deferred-note').forEach(n=>n.remove());
 const scope=document.createElement('p');scope.className='record-scope';ledger.pages[0].prepend(scope);const totals=document.createElement('div');totals.className='ledger-totals';ledger.pages[1].append(totals);
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
 const handbook=book(manual,'炉谱',['炼丹规则','本次炉讯']);const nodes=handbook.original;
 const logs=nodes.find(n=>n.id==='logList');
 const dataSource=document.createElement('section');dataSource.id='uxDataSettingsSource';dataSource.hidden=true;let data=false;for(const n of nodes){if(n.textContent==='试玩记录'){data=true;continue;}if(data)dataSource.append(n);}document.body.append(dataSource);
 handbook.pages[0].innerHTML='<h3>取料与丹药</h3><p>点药包拿起，再点炉口投入；也可拖入。点火门扇火炼化。点击收丹入匣，进入丹匣后再选择提交委托或处理丹药。持物可点“放回”；电脑也可按 Esc。</p><p>投入成功才扣料。每包客料预支24文。交单按全额药力计算，炸丹免赔。成丹交易先抵料款，寄售按抵扣后的售价加价。所有成丹统一进入丹匣。选丹后明确提交才计入委托，明确出售或寄售才结算。百转后必须收丹。</p><h3 data-rules-section="probability">五类炼化结果</h3><dl class="rules-outcomes"><dt>炸丹</dt><dd>损失当前炉内丹药。</dd><dt>受损</dt><dd>通常回落一转；凝丹炉可保住转数。药力按炉具保护效果扣减。</dd><dt>维持</dt><dd>保留转数与药力。</dd><dt>成功</dt><dd>升转并提升药力。</dd><dt>大成功</dt><dd>基础提升两转，并提升药力。</dd></dl><p>五类互斥，合计100%。数字四舍五入，色带使用真实比例；保护后的实际概率以炉前窗口为准。</p><h3>九宫步罡</h3><p>同一颗丹每完成9次催炼且仍可继续炼制，开启九宫步罡。依次落下九印，丹炉便自动催炼7次，期间不会炸丹。每次单独结算，仍可能受损或维持。达到百转即成丹，换丹重新计数。</p><h3>铺契与采购</h3><p>邵四娘每七天结一次铺租。收工时可先付现有铜钱，欠额可在之后收工时补缴。第三周可从丹匣挑一颗药力至少120的丹交给药铺，按即时售价加20文；九转及以上改加120文，限购一颗。</p>';
 const logScope=document.createElement('p');logScope.className='log-scope';handbook.pages[1].append(logScope);if(logs)handbook.pages[1].append(logs);
 function render(){const c=api.campaign();if(!c)return;renderLease(c);const s=api.snapshot(),e=E.ensure(c);record.dataset.recordSource=s.order?'commission':'forge';scope.textContent=s.order?'当前委托统计':'当前炼丹统计';logScope.textContent=s.order?'当前委托 · 最近8条':'当前炼丹 · 最近8条';
  UX.html(totals,'<h3>累计经营概览</h3><dl><dt>累计收入</dt><dd>'+e.earned+' 铜钱</dd><dt>累计支出</dt><dd>'+e.spent+' 铜钱</dd><dt>累计净变化</dt><dd>'+(e.earned-e.spent)+' 铜钱</dd></dl><h3>每日经营结果</h3>'+(c.history.length?c.history.slice().reverse().map(d=>'<article class="ledger-day"><strong>第 '+d.day+' 天</strong><p>完成 '+d.completed+' · 未完成委托 '+d.failed+' · 未接跳过 '+(d.skipped??'未记录')+'</p><p>委托收入 '+(d.commissionIncome===undefined?'未记录':d.commissionIncome+' 铜钱')+' · 赠药 '+(d.gifted===undefined?'未记录':d.gifted+' 包')+'</p>'+(d.rent?'<p>交铺租 '+d.rent.payment+' 铜钱'+(d.rent.remaining?' · 余欠 '+d.rent.remaining+' 铜钱':'')+'</p>':'')+'</article>').join(''):'<p>尚未日结</p><button data-ledger-counter>回柜台</button>'));
 }
 totals.addEventListener('click',e=>{if(e.target.closest('[data-ledger-counter]'))window.AlchemyViewState.navigate('orders');});
 window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view==='record'&&e.detail.context?.chapter==='lease'){ledger.select(1);requestAnimationFrame(()=>leaseLedger.scrollIntoView({block:'start'}));}if(e.detail.view==='manual'){handbook.select(0);if(e.detail.context?.chapter==='probability')requestAnimationFrame(()=>handbook.pages[0].querySelector('[data-rules-section=probability]')?.scrollIntoView({block:'start'}));}});window.addEventListener('alchemy:render',render);render();
})();
