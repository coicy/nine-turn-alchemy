(() => {
const api=window.AlchemyGame, header=document.querySelector('.game-layout');
const board=document.createElement('section');board.className='daily-board counter-board';
board.innerHTML=`<div class="daily-heading"><div><small>散修丹坊 · 三十日经营</small><h2 id="dayTitle">第 1 天 / 30 天</h2></div><strong id="careerTotal"></strong></div><p id="dailyHint" role="status"></p><div class="counter-scene"><div class="counter-sign">来客代炼 · 一笺一炉</div><div id="dailyOrders" class="counter-tickets" aria-label="今日客人来笺"></div><div class="counter-desk"><div id="counterLetter" class="counter-letter"></div><div class="counter-props"><div id="counterVisitor" class="counter-visitor" aria-live="polite"></div><div class="counter-parcels" id="counterParcels" aria-label="客人托付的三包药材"><img src="assets/counter-props-v72/herb-parcel.webp" alt="药材包"/><img src="assets/counter-props-v72/herb-parcel.webp" alt="药材包"/><img src="assets/counter-props-v72/herb-parcel.webp" alt="药材包"/></div><p id="counterParcelHint">客料暂寄柜上<br>接下后移交炼丹台</p><div class="counter-receipt" id="counterReceipt"></div></div></div></div><div class="daily-actions"><button id="abandonOrder" type="button">终止本单 · 免赔</button><button id="settleDay" type="button">结束今日</button><button id="nextDay" type="button" hidden>次日开门</button></div><div id="dailySummary" role="status"></div>`;
header.prepend(board);
const browse=document.createElement('button');browse.type='button';browse.className='browse-customers';browse.setAttribute('aria-controls','dailyOrders');board.querySelector('.counter-scene').prepend(browse);
let dayConfirm=false;
let browseAll=false;browse.onclick=()=>{browseAll=!browseAll;render();if(browseAll)$('dailyOrders').querySelector('button')?.focus({preventScroll:true});};
board.addEventListener('keydown',e=>{if(e.key==='Escape'&&browseAll){e.stopPropagation();e.preventDefault();browseAll=false;render();browse.focus();}});
let abandonConfirm=false,restartConfirm=false,selectedId=null;
const $=id=>document.getElementById(id);
const customers=window.AlchemyCustomers;
const lease = window.AlchemyLease;
const leaseSlip = document.createElement('aside');
leaseSlip.className = 'counter-lease-slip';
leaseSlip.hidden = true;
leaseSlip.setAttribute('aria-label', '铺契与药铺采购');
board.append(leaseSlip);
leaseSlip.addEventListener('click', event => {
  const button = event.target.closest('button');
  if (button?.dataset.leaseRoute === 'record') {
    window.AlchemyViewState.navigate('record',{anchor:button,chapter:'lease'});
  } else if (button?.dataset.leaseRoute === 'bag') {
    window.AlchemyViewState.navigate('bag',{anchor:button,objectId:'lease-purchase'});
  }
});
function renderLeaseSlip(c) {
  const today = lease.closingQuote(c);
  const next = c.lease?.terms.find(term => term.day > c.day);
  let rent = '';
  if (today.due) {
    rent = '应交铺租 · ' + today.due + ' 铜钱';
  } else if (next && (c.day === 1 || next.day - c.day <= 2)) {
    rent = '第 ' + next.day + ' 天交铺租 · ' + next.amount + ' 铜钱';
  }
  const offer = lease.canOffer(c);
  leaseSlip.hidden = (!rent && !offer) || c.phase === 'finished';
  const html = (rent ? '<button type="button" data-lease-route="record" data-focus-key="counter-lease-record"><span class="lease-seal" aria-hidden="true">邵</span><span>'+rent+'</span></button>' : '') +
    (offer ? '<button type="button" data-lease-route="bag" data-focus-key="counter-lease-bag"><strong>药铺采购</strong><span>第 '+lease.procurement.lastDay+' 天收工前 · 九转加价 '+lease.procurement.featuredPremium+'</span></button>' : '');
  if (leaseSlip.innerHTML !== html) leaseSlip.innerHTML = html;
}

const labels={pending:'待接单',active:'已接',completed:'已完成',failed:'未完成',skipped:'未接' };
const note=document.createElement('button');note.type='button';note.id='counterNote';note.className='counter-note';note.hidden=true;note.setAttribute('aria-controls','counterLetter');board.querySelector('.counter-desk').append(note);
let noteImage;
const noteLabel = document.createElement('span');
noteLabel.className = 'counter-note-label';
noteLabel.textContent = '查看委托纸笺';
note.append(noteLabel);

let nextLetter=false;let noteId=null,noteStatus=null,noteReady=false,letterOpen=false,noteTimer=0,noteOrder=null,notePhase=null;
function syncNote() {
  const canRead = !!noteOrder && notePhase === 'open' && board.dataset.shellActive === 'true' && noteReady;
  const wasHidden = note.hidden;
  note.hidden = !canRead;
  if (nextLetter && canRead && !window.AlchemyOpening?.active) {
    letterOpen = true;
    nextLetter = false;
  }
  note.setAttribute('aria-expanded', String(letterOpen));
  $('counterLetter').hidden = !canRead || !letterOpen;
  board.classList.toggle('counter-letter-open', canRead && letterOpen);
  if (note.hidden !== wasHidden) window.dispatchEvent(new Event('alchemy:counter-note-availability'));
}
function loadNoteArt(src) {
  note.dataset.noteArt = 'text';
  if (noteImage) noteImage.remove();
  const image = new Image();
  noteImage = image;
  image.alt = '';
  image.setAttribute('aria-hidden', 'true');
  image.onload = () => {
    if (noteImage !== image) return;
    note.append(image);
    note.dataset.noteArt = 'image';
  };
  image.src = src;
}
function updateNote(order, phase) {
  noteOrder = order;
  notePhase = phase;
  if (order?.id !== noteId) {
    clearTimeout(noteTimer);
    noteTimer = 0;
    noteId = order?.id;
    noteStatus = order?.status;
    noteReady = false;
    letterOpen = false;
  } else if (order?.status !== noteStatus) {
    noteStatus = order?.status;
    letterOpen = false;
  }
  if (order) {
    const art = customers.note(order);
    if (note.dataset.noteStyle !== art.id) {
      note.dataset.noteStyle = art.id;
      loadNoteArt(art.src);
    }
    const label = '查看' + customers.profile(order).name + '的委托详情';
    note.title = label;
    note.setAttribute('aria-label', label);
  }
  if (order && phase === 'open' && board.dataset.shellActive === 'true' && !noteReady && !noteTimer) {
    noteTimer = setTimeout(() => {
      noteTimer = 0;
      if (noteId !== order.id || board.dataset.shellActive !== 'true') return;
      noteReady = true;
      syncNote();
    }, window.AlchemyOpening?.active && !matchMedia('(prefers-reduced-motion: reduce)').matches ? 420 : 0);
  }
  syncNote();
}
note.onclick=()=>{letterOpen=!letterOpen;syncNote();if(letterOpen)$('counterLetter').querySelector('button')?.focus({preventScroll:true});};
board.addEventListener('click',e=>{if(e.target.closest('[data-close-letter]')){letterOpen=false;syncNote();note.focus();}});
board.addEventListener('keydown',e=>{if(e.key==='Escape'&&letterOpen&&!browseAll){e.stopPropagation();e.preventDefault();letterOpen=false;syncNote();note.focus();}});
window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view==='orders'){board.scrollLeft=0;board.scrollTop=0;const c=api.campaign();if(!e.detail.returning&&!window.AlchemyOpening?.active&&c?.phase==='open'&&!c.orders.some(o=>o.status==='active')){selectedId=c.orders.find(o=>o.status==='pending')?.id||selectedId;render();}updateNote(noteOrder,notePhase);}else if(e.detail.location!=='orders'){clearTimeout(noteTimer);noteTimer=0;noteReady=false;letterOpen=false;syncNote();}});
// An order can close from the furnace, the bag, or the counter.
let previousActiveId = null;
let awaitingReception = null;
function advanceReception() {
  if (!awaitingReception) return;
  const c = api.campaign();
  if (!c || c.phase !== 'open' || c.day !== awaitingReception.day || c.activeId) {
    awaitingReception = null;
    return;
  }
  const s = api.snapshot(), scene = window.AlchemyScene2D;
  if (!s.pillEnded || s.busy || scene?.busy || scene?.held || window.AlchemyInteractionBusy) return;
  if (document.querySelector('dialog[open]')) return;
  if (window.AlchemyViewState.snapshot().reading) return;
  if (window.AlchemyMerchantVisit?.interceptReception()) return;
  if (window.AlchemyCraftBuyer?.interceptReception()) return;
  const next = c.orders.find(order => order.status === 'pending');
  selectedId = next?.id || awaitingReception.closedId;
  awaitingReception = null;
  browseAll = false;
  nextLetter = !!next;
  letterOpen = false;
  if (window.AlchemyViewState.snapshot().current !== 'orders') window.AlchemyViewState.navigate('orders');
  render();
  if (next && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const portrait = board.querySelector('#counterVisitor .visitor-portrait');
    portrait?.animate?.([{translate:'28px 0', opacity:0}, {translate:'0 0', opacity:1}],
      {duration:280, easing:'ease-out'});
  }
}
function observeQueue(c) {
  if (previousActiveId && !c.activeId && c.phase === 'open' &&
      c.orders.some(order => order.id === previousActiveId && ['completed','failed'].includes(order.status))) {
    awaitingReception = {day:c.day, closedId:previousActiveId};
  }
  previousActiveId = c.activeId;
  if (awaitingReception) queueMicrotask(advanceReception);
}
for (const event of ['alchemy:interaction','alchemy:carry','alchemy:view-ready']) {
  window.addEventListener(event, () => { if (awaitingReception) queueMicrotask(advanceReception); });
}
function render(){const c=api.campaign();if(!c)return;observeQueue(c);const s=api.snapshot(),completed=c.orders.filter(o=>o.status==='completed').length,resolved=c.orders.filter(o=>['completed','failed'].includes(o.status)).length,active=!!c.orders.some(o=>o.status==='active');
 $('dayTitle').textContent='';
 $('careerTotal').textContent=`今日完成 ${completed} / ${c.orders.length} 单`;
 $('dailyHint').textContent=c.phase==='finished'?`三十日累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。查看总评，或重新经营。`:c.phase==='settled'?'今日已结清，准备迎接下一天。':`今日 ${completed} / ${c.orders.length} 单完成 · ${resolved} / ${c.orders.length} 单已处理。一次只接一单，明确提交后结单；成功余药赠留，失败退回且免赔。`;
 const focused=false;board.classList.remove('counter-focused');if(c.phase!=='open')browseAll=false;board.classList.toggle('counter-book-open',browseAll);browse.hidden=c.phase!=='open';browse.textContent=browseAll?'收起委托簿':'委托簿';browse.setAttribute('aria-expanded',String(browseAll));$('dailyOrders').hidden=!browseAll;$('dailyHint').hidden=c.phase==='open';
 if(focused&&c.phase==='open')$('dailyHint').textContent=active?'先办妥手中的委托，再接待下一位客人。':'为你选好一份来笺。看清所求药力与工钱，再落印接下。';
 if(!c.orders.some(o=>o.id===selectedId)||focused&&!['active','pending'].includes(c.orders.find(o=>o.id===selectedId)?.status))selectedId=c.orders.find(o=>o.status==='active')?.id||c.orders.find(o=>o.status==='pending')?.id||c.orders[0]?.id;
 const selected=c.orders.find(o=>o.id===selectedId);
 $('dailyOrders').innerHTML=c.orders.map((o,i)=>`<button type="button" class="counter-ticket ${o.status} ${o.id===selectedId?'selected':''}" data-letter="${o.id}" aria-pressed="${o.id===selectedId}"><small>来笺 ${i+1} · ${labels[o.status]}</small><strong>${customers.profile(o).name}</strong><span>${o.client} · ${o.name}</span></button>`).join('');
 if(window.AlchemyMerchantVisit?.atCounter){window.AlchemyMerchantVisit.paintCounter();}
 else if(window.AlchemyCraftBuyer?.atCounter){window.AlchemyCraftBuyer.paintCounter();}
 else if(selected){const o=selected,delivered=Math.round(o.status==='active'?s.delivered:o.delivered||0),canAccept=!active&&c.phase==='open'&&o.status==='pending'&&!window.AlchemyInteractionBusy&&!s.busy;
  $('counterLetter').innerHTML=`<header class="letter-top"><span class="letter-kicker">来客手书</span><button class="letter-close" type="button" data-close-letter aria-label="收起委托详情">收起</button></header><div class="letter-title-row"><h3>${o.name}</h3><div class="counter-seal ${o.status}">${labels[o.status]}</div></div><p>在下${o.client}，托付${o.materials}包${({warm:'温性',cool:'寒性',neutral:'平性'}[o.nature]||'平性')}药材，请代炼成丹。</p><dl><div><dt>所求药力</dt><dd>${o.target}</dd></div><div><dt>约定工钱</dt><dd>${window.AlchemyEconomy?.fee(o)||0} 铜钱</dd></div></dl><p class="letter-terms">提交丹药累计达标后结工钱；未成免赔，未用材料赠留。</p><p class="letter-signature">—— ${o.client}</p>${o.status==='pending'?`<button class="accept-stamp" type="button" data-order="${o.id}" ${canAccept?'':'disabled'}>${canAccept?'落印接下':active?'先办妥手中委托':'今日已收柜'}</button>`:o.status==='active'?'<button class="accept-stamp" type="button" data-return-forge>携料回炉 ›</button>':'<p class="letter-closed">此笺已归档，可翻看其他来笺。</p>'}`;
 const away=['completed','failed','skipped'].includes(o.status),visitorKey=o.id+o.status;
 const visitor=$('counterVisitor');if(visitor.dataset.visitorKey!==visitorKey){visitor.dataset.visitorKey=visitorKey;visitor.classList.toggle('is-away',away);visitor.replaceChildren();if(away){const departed=document.createElement('div');departed.className='visitor-departed';departed.textContent='';visitor.append(departed);}else{const v=customers.visit(o),bubble=document.createElement('div'),title=document.createElement('strong'),speech=document.createElement('p');bubble.className='visitor-dialogue';title.textContent=v.name+' · '+v.role;speech.textContent=customers.line(o);bubble.append(title,speech);visitor.append(bubble,window.AlchemyCustomerView.portrait(o));}}
 board.dataset.counterState=c.phase==='open'?o.status:c.phase;
 const parcelCount=o.status==='pending'?o.materials:0;$('counterParcels').innerHTML=Array.from({length:parcelCount},()=>'<img src="assets/counter-props-v72/herb-parcel.webp" alt="药材包"/>').join('');$('counterParcelHint').textContent=o.status==='pending'?'客料 · '+o.materials+' 包':'';$('counterParcelHint').hidden=o.status!=='pending';
 $('counterReceipt').hidden=o.status==='pending';$('counterReceipt').textContent=o.status==='pending'?'':o.status==='active'?`已接 · 客料已领至药匣 · 已交 ${delivered} / ${o.target}`:customers.settlement(o);
 }

 $('abandonOrder').hidden=!active;
 $('abandonOrder').disabled=s.busy||!s.pillEnded||!!window.AlchemyInteractionBusy;
 $('abandonOrder').textContent=abandonConfirm?'确认终止并退还材料':'终止本单 · 免赔';
 $('settleDay').hidden=c.phase!=='open';$('settleDay').disabled=active||!s.pillEnded||!!window.AlchemyInteractionBusy;
 dayConfirm=false;
 $('settleDay').textContent='敲铃 · 结束今日';
 $('nextDay').hidden=c.phase!=='settled';$('nextDay').textContent=`迎接第 ${c.day+1} 天`;
 const total=c.history.reduce((n,d)=>n+d.completed,0); const totalOrders=c.history.reduce((n,d)=>n+d.completed+d.failed,0);
 if(!$('counterLetter').querySelector('[data-close-letter]')){const close=document.createElement('button');close.type='button';close.className='letter-close';close.dataset.closeLetter='';close.textContent='收起';close.setAttribute('aria-label','收起委托详情');$('counterLetter').prepend(close);}
 updateNote(window.AlchemyMerchantVisit?.atCounter||window.AlchemyCraftBuyer?.atCounter?null:selected,c.phase);
 const skipped=c.orders.filter(o=>o.status==='skipped').length,failed=c.orders.filter(o=>o.status==='failed').length,income=c.orders.reduce((n,o)=>n+(o.reward||0),0),gifted=c.orders.reduce((n,o)=>n+(o.gifted||0),0);
 $('dailySummary').textContent=c.phase==='finished'?`三十日经营结束 · 完成 ${total} 单 · 未完成委托 ${totalOrders-total} 单` :c.phase==='settled'?`今日结清：完成 ${completed} 单 · 未完成委托 ${failed} 单 · 未接跳过 ${skipped} 单\n委托收入 ${income} 铜钱 · 赠药 ${gifted} 包`:'';
  renderLeaseSlip(c);
  const receipt = c.history.at(-1);
  if (c.phase !== 'open' && receipt?.day === c.day && receipt.rent) {
    $('dailySummary').textContent += '\n铺租已交 '+ receipt.rent.payment + ' 铜钱' +
      (receipt.rent.remaining ? ' · 尚欠 '+ receipt.rent.remaining + ' 铜钱' : '');
  }
  if (c.phase === 'finished' && c.lease?.terms.length) {
    const late = c.lease.terms.some(term => term.paidDay > term.day + 2);
    $('dailySummary').textContent += lease.closingQuote(c).due ?
      '\n邵四娘：铺钱尚未结清，今日交还铺面。' :
      late ? '\n邵四娘：欠下的铺钱已补齐，可以续租。' :
      '\n邵四娘：铺钱都结了，这间铺子可以续租。';
  }


}
board.addEventListener('click',e=>{const letter=e.target.closest('[data-letter]');if(letter){selectedId=letter.dataset.letter;browseAll=false;render();letterOpen=true;syncNote();$('counterLetter').querySelector('.accept-stamp,button')?.focus({preventScroll:true});return;}if(e.target.closest('[data-return-forge]')){window.dispatchEvent(new Event('alchemy:work'));return;}const target=e.target.closest('[data-order]');if(target&&!target.disabled){abandonConfirm=false;api.chooseOrder(target.dataset.order);}});
 $('abandonOrder').addEventListener('click',()=>window.AlchemyUX.confirm({title:'终止本单',message:'未用本单料退还，本单记为未完成，丹匣丹药保留，免赔。',confirmLabel:'终止并退还',onConfirm:()=>api.abandonOrder()}));
$('settleDay').addEventListener('click', () => {
  const c = api.campaign();
  const pending = c.orders.filter(order => order.status === 'pending').length;
  const rent = lease.closingQuote(c);
  let message = '收工将跳过 '+pending+' 份未接委托，不计未完成委托。';
  if (rent.due) {
    const grace = c.day < rent.graceDay ? '可在第 '+rent.graceDay+' 天收工前补齐。' :
      c.day === rent.graceDay ? '今日是宽限末日。' : '这笔铺租已逾期，仍可补缴。';
    message = '邵四娘的账簿上写着这笔铺租。应交 '+rent.due+'，本次实交 '+rent.payment+'，交后剩 '+rent.balance+' 铜钱。'+
      (rent.remaining ? '尚欠 '+rent.remaining+' 铜钱。'+grace : '') +
      '\n'+message;
  }
  window.AlchemyUX.confirm({title:rent.due ? '收工与结租' : '结束今日',message,confirmLabel:'确认收工',onConfirm:()=>api.endDay()});
});
$('nextDay').addEventListener('click',()=>{abandonConfirm=false;if(api.nextDay())window.AlchemyViewState.navigate('orders');});
$('restartButton').textContent='重新经营';
$('restartButton').addEventListener('click',e=>{if(api.snapshot().started&&!restartConfirm){e.preventDefault();e.stopImmediatePropagation();restartConfirm=true;$('restartButton').textContent='确认重开30天？';}else{restartConfirm=false;$('restartButton').textContent='重新经营';}},true);
window.addEventListener('alchemy:merchant-change',render);window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
