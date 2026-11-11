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
const labels={pending:'待接单',active:'已接',completed:'已完成',failed:'未完成',skipped:'未接' };
const note=document.createElement('button');note.type='button';note.id='counterNote';note.className='counter-note';note.hidden=true;note.setAttribute('aria-controls','counterLetter');board.querySelector('.counter-desk').append(note);
let noteArtReady=false,noteArtSource="",noteImage=null;
let nextLetter=false;let noteId=null,noteStatus=null,noteReady=false,letterOpen=false,noteTimer=0,noteOrder=null,notePhase=null;
function syncNote(){const available=!!noteOrder&&notePhase==='open',visible=board.dataset.shellActive==='true';note.hidden=!available||!visible||!noteReady||!noteArtReady;if(nextLetter&&noteReady&&available&&visible&&!window.AlchemyOpening?.active){letterOpen=true;nextLetter=false;}note.setAttribute('aria-expanded',String(letterOpen));$('counterLetter').hidden=!available||!visible||!noteReady||!letterOpen;board.classList.toggle('counter-letter-open',letterOpen&&noteReady&&visible);}
function updateNote(order,phase){noteOrder=order;notePhase=phase;if(order?.id!==noteId){clearTimeout(noteTimer);noteTimer=0;noteId=order?.id;noteStatus=order?.status;noteReady=false;letterOpen=false;}else if(order?.status!==noteStatus){noteStatus=order?.status;letterOpen=false;}
 if(order){const art=customers.note(order);note.dataset.noteStyle=art.id;if(noteArtSource!==art.src){noteArtReady=false;delete note.dataset.noteFallback;noteArtSource=art.src;noteImage=new Image();noteImage.alt='';noteImage.setAttribute('aria-hidden','true');const expected=art.src;noteImage.onload=()=>{if(noteArtSource===expected){noteArtReady=true;syncNote();}};noteImage.onerror=()=>{if(noteArtSource!==expected)return;noteImage.onerror=null;note.dataset.noteFallback='true';noteImage.src='assets/counter-props-v72/merchant.webp';};noteImage.src=art.src;}note.replaceChildren(noteImage);note.title='查看'+customers.profile(order).name+'的委托详情';note.setAttribute('aria-label',`查看${customers.profile(order).name}的委托详情`);}
 if(order&&phase==='open'&&board.dataset.shellActive==='true'&&!noteReady&&!noteTimer){const id=order.id;noteTimer=setTimeout(()=>{noteTimer=0;if(noteId===id&&board.dataset.shellActive==='true'){noteReady=true;syncNote();}},window.AlchemyOpening?.active&&!matchMedia('(prefers-reduced-motion: reduce)').matches?420:0);}syncNote();}
note.onclick=()=>{letterOpen=!letterOpen;syncNote();if(letterOpen)$('counterLetter').querySelector('button')?.focus({preventScroll:true});};
board.addEventListener('click',e=>{if(e.target.closest('[data-close-letter]')){letterOpen=false;syncNote();note.focus();}});
board.addEventListener('keydown',e=>{if(e.key==='Escape'&&letterOpen&&!browseAll){e.stopPropagation();e.preventDefault();letterOpen=false;syncNote();note.focus();}});
window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view==='orders'){board.scrollLeft=0;board.scrollTop=0;const c=api.campaign();if(!e.detail.returning&&!window.AlchemyOpening?.active&&c?.phase==='open'&&!c.orders.some(o=>o.status==='active')){selectedId=c.orders.find(o=>o.status==='pending')?.id||selectedId;render();}updateNote(noteOrder,notePhase);}else if(e.detail.location!=='orders'){clearTimeout(noteTimer);noteTimer=0;noteReady=false;letterOpen=false;syncNote();}});
window.addEventListener('alchemy:next-customer',()=>{const c=api.campaign(),s=api.snapshot();if(!c||c.phase!=='open'||c.orders.some(o=>o.status==='active')||s.busy||window.AlchemyInteractionBusy)return;const next=c.orders.find(o=>o.status==='pending');if(next)selectedId=next.id;browseAll=false;nextLetter=true;letterOpen=false;render();});
function render(){const c=api.campaign();if(!c)return;const s=api.snapshot(),completed=c.orders.filter(o=>o.status==='completed').length,resolved=c.orders.filter(o=>['completed','failed'].includes(o.status)).length,active=!!c.orders.some(o=>o.status==='active');
 $('dayTitle').textContent='';
 $('careerTotal').textContent=`今日完成 ${completed} / ${c.orders.length} 单`;
 $('dailyHint').textContent=c.phase==='finished'?`三十日累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。查看总评，或重新经营。`:c.phase==='settled'?'今日已结清，准备迎接下一天。':`今日 ${completed} / ${c.orders.length} 单完成 · ${resolved} / ${c.orders.length} 单已处理。一次只接一单，明确提交后结单；成功余药赠留，失败退回且免赔。`;
 const focused=false;board.classList.remove('counter-focused');if(c.phase!=='open')browseAll=false;board.classList.toggle('counter-book-open',browseAll);browse.hidden=c.phase!=='open';browse.textContent=browseAll?'收起委托簿':'委托簿';browse.setAttribute('aria-expanded',String(browseAll));$('dailyOrders').hidden=!browseAll;$('dailyHint').hidden=c.phase==='open';
 if(focused&&c.phase==='open')$('dailyHint').textContent=active?'先办妥手中的委托，再接待下一位客人。':'为你选好一份来笺。看清所求药力与工钱，再落印接下。';
 if(!c.orders.some(o=>o.id===selectedId)||focused&&!['active','pending'].includes(c.orders.find(o=>o.id===selectedId)?.status))selectedId=c.orders.find(o=>o.status==='active')?.id||c.orders.find(o=>o.status==='pending')?.id||c.orders[0]?.id;
 const selected=c.orders.find(o=>o.id===selectedId);
 $('dailyOrders').innerHTML=c.orders.map((o,i)=>`<button type="button" class="counter-ticket ${o.status} ${o.id===selectedId?'selected':''}" data-letter="${o.id}" aria-pressed="${o.id===selectedId}"><small>来笺 ${i+1} · ${labels[o.status]}</small><strong>${customers.profile(o).name}</strong><span>${o.client} · ${o.name}</span></button>`).join('');
 if(selected){const o=selected,delivered=Math.round(o.status==='active'?s.delivered:o.delivered||0),canAccept=!active&&c.phase==='open'&&o.status==='pending'&&!window.AlchemyInteractionBusy&&!s.busy;
 $('counterLetter').innerHTML=`<header class="letter-top"><span class="letter-kicker">来客手书</span><button class="letter-close" type="button" data-close-letter aria-label="收起委托详情">收起</button></header><div class="letter-title-row"><h3>${o.name}</h3><div class="counter-seal ${o.status}">${labels[o.status]}</div></div><p>在下${o.client}，托付${o.materials}包${({warm:'温性',cool:'寒性',neutral:'平性'}[o.nature]||'平性')}药材，请代炼成丹。</p><dl><div><dt>所求药力</dt><dd>${o.target}</dd></div><div><dt>约定工钱</dt><dd>${window.AlchemyEconomy?.fee(o)||0} 铜钱</dd></div></dl><p class="letter-terms">提交丹药累计达标后结工钱；未成免赔，未用材料赠留。</p><p class="letter-signature">—— ${o.client}</p>${o.status==='pending'?`<button class="accept-stamp" type="button" data-order="${o.id}" ${canAccept?'':'disabled'}>${canAccept?'落印接下':active?(c.selfOrder?.status==='active'?'先处理自炼丹药':'先办妥手中委托'):'今日已收柜'}</button>`:o.status==='active'?'<button class="accept-stamp" type="button" data-return-forge>携料回炉 ›</button>':'<p class="letter-closed">此笺已归档，可翻看其他来笺。</p>'}`;
 const away=['completed','failed','skipped'].includes(o.status),visitorKey=o.id+o.status;
 const visitor=$('counterVisitor');if(visitor.dataset.visitorKey!==visitorKey){visitor.dataset.visitorKey=visitorKey;visitor.classList.toggle('is-away',away);visitor.replaceChildren();if(away){const departed=document.createElement('div');departed.className='visitor-departed';departed.textContent='';visitor.append(departed);}else{const v=customers.visit(o),bubble=document.createElement('div'),title=document.createElement('strong'),speech=document.createElement('p');bubble.className='visitor-dialogue';title.textContent=v.name+' · '+v.role;speech.textContent=customers.line(o);bubble.append(title,speech);visitor.append(bubble,window.AlchemyCustomerView.portrait(o));}}
 board.dataset.counterState=c.phase==='open'?o.status:c.phase;
 const parcelCount=o.status==='pending'?o.materials:0;$('counterParcels').innerHTML=Array.from({length:parcelCount},()=>'<img src="assets/counter-props-v72/herb-parcel.webp" alt="药材包"/>').join('');$('counterParcelHint').textContent=o.status==='pending'?'客料 · '+o.materials+' 包':'';$('counterParcelHint').hidden=o.status!=='pending';
 $('counterReceipt').hidden=o.status==='pending';$('counterReceipt').textContent=o.status==='pending'?'':o.status==='active'?`已接 · 客料已领至药匣 · 交付 ${delivered} / ${o.target}`:customers.settlement(o);
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
 updateNote(selected,c.phase);
 const skipped=c.orders.filter(o=>o.status==='skipped').length,failed=c.orders.filter(o=>o.status==='failed').length,income=c.orders.reduce((n,o)=>n+(o.reward||0),0),gifted=c.orders.reduce((n,o)=>n+(o.gifted||0),0);
 $('dailySummary').textContent=c.phase==='finished'?`三十日经营结束 · 完成 ${total} 单 · 炼制失败 ${totalOrders-total} 单` :c.phase==='settled'?`今日结清：完成 ${completed} 单 · 炼制失败 ${failed} 单 · 未接跳过 ${skipped} 单\n委托收入 ${income} 铜钱 · 赠药 ${gifted} 包`:'';

}
board.addEventListener('click',e=>{const letter=e.target.closest('[data-letter]');if(letter){selectedId=letter.dataset.letter;browseAll=false;render();letterOpen=true;syncNote();$('counterLetter').querySelector('.accept-stamp,button')?.focus({preventScroll:true});return;}if(e.target.closest('[data-return-forge]')){window.dispatchEvent(new Event('alchemy:work'));return;}const target=e.target.closest('[data-order]');if(target&&!target.disabled){abandonConfirm=false;api.chooseOrder(target.dataset.order);}});
$('abandonOrder').addEventListener('click',()=>window.AlchemyUX.confirm({title:'终止本单',message:'未用本单料退还，本单记为未完成，库存丹药保留，免赔。',confirmLabel:'终止并退还',onConfirm:()=>api.abandonOrder()}));
$('settleDay').addEventListener('click',()=>{const c=api.campaign(),pending=c.orders.filter(o=>o.status==='pending').length;window.AlchemyUX.confirm({title:'结束今日',message:`收工将跳过 ${pending} 份未接委托，不计炼制失败。`,confirmLabel:'确认收工',onConfirm:()=>api.endDay()});});
$('nextDay').addEventListener('click',()=>{abandonConfirm=false;if(api.nextDay())window.AlchemyViewState.navigate('orders');});
$('restartButton').textContent='重新经营';
$('restartButton').addEventListener('click',e=>{if(api.snapshot().started&&!restartConfirm){e.preventDefault();e.stopImmediatePropagation();restartConfirm=true;$('restartButton').textContent='确认重开30天？';}else{restartConfirm=false;$('restartButton').textContent='重新经营';}},true);
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
