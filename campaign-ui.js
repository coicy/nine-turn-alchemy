(() => {
const api=window.AlchemyGame, header=document.querySelector('.game-layout');
const board=document.createElement('section');board.className='daily-board counter-board';
board.innerHTML=`<div class="daily-heading"><div><small>散修丹坊 · 三十日经营</small><h2 id="dayTitle">第 1 天 / 30 天</h2></div><strong id="careerTotal"></strong></div><p id="dailyHint" role="status"></p><div class="counter-scene"><div class="counter-sign">来客代炼 · 一笺一炉</div><div id="dailyOrders" class="counter-tickets" aria-label="今日客人来笺"></div><div class="counter-desk"><div id="counterLetter" class="counter-letter"></div><div class="counter-props"><div id="counterVisitor" class="counter-visitor" aria-live="polite"></div><div class="counter-parcels" id="counterParcels" aria-label="客人托付的三包药材"><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/></div><p id="counterParcelHint">客料暂寄柜上<br>接下后移交炼丹台</p><div class="counter-receipt" id="counterReceipt"></div></div></div></div><div class="daily-actions"><button id="abandonOrder" type="button">终止本单 · 免赔</button><button id="settleDay" type="button">结束今日</button><button id="nextDay" type="button" hidden>次日开门</button></div><div id="dailySummary" role="status"></div>`;
header.prepend(board);
const browse=document.createElement('button');browse.type='button';browse.className='browse-customers';browse.setAttribute('aria-controls','dailyOrders');board.querySelector('.counter-scene').prepend(browse);
let dayConfirm=false;
let browseAll=false;browse.onclick=()=>{browseAll=!browseAll;render();};
let abandonConfirm=false,restartConfirm=false,selectedId=null;
const $=id=>document.getElementById(id);
const customers=window.AlchemyCustomers;
const labels={pending:'待接单',active:'炼制中',completed:'已完成',failed:'未完成',skipped:'未接' };
function render(){const c=api.campaign();if(!c)return;const s=api.snapshot(),completed=c.orders.filter(o=>o.status==='completed').length,resolved=c.orders.filter(o=>['completed','failed'].includes(o.status)).length,active=!!(c.selfOrder?.status==='active'||c.orders.some(o=>o.status==='active'));
 $('dayTitle').textContent=`第 ${c.day} 天 / 30 天`;
 $('careerTotal').textContent=`累计完成 ${c.history.reduce((n,d)=>n+d.completed,0)+(c.phase==='open'?completed:0)} 单`;
 $('dailyHint').textContent=c.phase==='finished'?`三十日累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。查看总评，或重新经营。`:c.phase==='settled'?'今日已结清，准备迎接下一天。':`今日 ${completed} / ${c.orders.length} 单完成 · ${resolved} / ${c.orders.length} 单已处理。一次只接一单，成丹归客；成功余药赠留，失败退回且免赔。`;
 const focused=c.day===1&&!c.history.length&&!browseAll;board.classList.toggle('counter-focused',focused);browse.hidden=c.phase!=='open'||c.day!==1||!!c.history.length;browse.textContent=focused?'查看其他来客（'+c.orders.filter(o=>o.status==='pending').length+' 位待接）':'只看当前来笺';browse.setAttribute('aria-expanded',String(!focused));
 if(focused&&c.phase==='open')$('dailyHint').textContent=active?'先办妥手中的委托，再接待下一位客人。':'为你选好一份来笺。看清所求丹值与工钱，再落印接下。';
 if(!c.orders.some(o=>o.id===selectedId)||focused&&!['active','pending'].includes(c.orders.find(o=>o.id===selectedId)?.status))selectedId=c.orders.find(o=>o.status==='active')?.id||c.orders.find(o=>o.status==='pending')?.id||c.orders[0]?.id;
 const selected=c.orders.find(o=>o.id===selectedId);
 $('dailyOrders').innerHTML=c.orders.map((o,i)=>`<button type="button" class="counter-ticket ${o.status} ${o.id===selectedId?'selected':''}" data-letter="${o.id}" aria-pressed="${o.id===selectedId}"><small>来笺 ${i+1} · ${labels[o.status]}</small><strong>${customers.profile(o).name}</strong><span>${o.client} · ${o.name}</span></button>`).join('');
 if(selected){const o=selected,delivered=Math.round(o.status==='active'?s.delivered:o.delivered||0),canAccept=!active&&c.phase==='open'&&o.status==='pending'&&!window.AlchemyInteractionBusy&&!s.busy;
 $('counterLetter').innerHTML=`<span class="letter-kicker">来客手书 · ${labels[o.status]}</span><h3>${o.name}</h3><p class="letter-salutation">掌柜亲启：</p><p>在下${o.client}，托付${o.materials}包${({warm:'温性',cool:'寒性',neutral:'平性'}[o.nature]||'平性')}药材，请代炼成丹。</p><dl><div><dt>所求丹值</dt><dd>${o.target}</dd></div><div><dt>约定工钱</dt><dd>${window.AlchemyEconomy?.fee(o)||0} 铜钱</dd></div></dl><p class="letter-terms">成丹归客，未成免赔。成功后，未用药材赠予掌柜。</p><p class="letter-signature">—— ${o.client} 敬托</p><div class="counter-seal ${o.status}">${labels[o.status]}</div>${o.status==='pending'?`<button class="accept-stamp" type="button" data-order="${o.id}" ${canAccept?'':'disabled'}>${canAccept?'落印接下':active?'先办妥手中委托':'今日已收柜'}</button>`:o.status==='active'?'<button class="accept-stamp" type="button" data-return-forge>携料回炉 ›</button>':'<p class="letter-closed">此笺已归档，可翻看其他来笺。</p>'}`;
 const away=['completed','failed','skipped'].includes(o.status),visitorKey=o.id+o.status;
 const visitor=$('counterVisitor');if(visitor.dataset.visitorKey!==visitorKey){visitor.dataset.visitorKey=visitorKey;visitor.classList.toggle('is-away',away);visitor.replaceChildren();const v=customers.visit(o),bubble=document.createElement('div'),title=document.createElement('strong'),speech=document.createElement('p');bubble.className='visitor-dialogue';title.textContent=v.name+' · '+v.role+(away?' · 留言':'');speech.textContent=customers.line(o);bubble.append(title,speech);visitor.append(bubble);if(away){const note=document.createElement('div');note.className='visitor-departed';note.textContent='客人已离柜 · 此笺留档';visitor.append(note);}else visitor.append(window.AlchemyCustomerView.portrait(o));}
 const parcelCount=o.status==='pending'?o.materials:o.status==='active'?Math.max(0,o.materials-s.attempt):Math.max(0,o.gifted||o.returned||0);$('counterParcels').innerHTML=Array.from({length:parcelCount},()=>'<img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/>').join('');$('counterParcelHint').textContent=o.status==='pending'?'客料暂寄柜上 · 落印后领料':o.status==='active'?`已领至炉台 · 剩余 ${parcelCount} 包`:o.gifted?'余药已赠留掌柜':'成丹与余料已归客';
 $('counterReceipt').textContent=o.status==='pending'?'待落印 · 尚未领料':o.status==='active'?`柜台收讫丹值 ${delivered} / ${o.target}`:`交付丹值 ${delivered} · ${o.gifted?'赠留余药 '+o.gifted+' 包':'归还余料 '+(o.returned||0)+' 包'}`;
 }

 $('abandonOrder').hidden=!active;
 $('abandonOrder').disabled=s.busy||!s.pillEnded||!!window.AlchemyInteractionBusy;
 $('abandonOrder').textContent=abandonConfirm?'确认终止并退还材料':'终止本单 · 免赔';
 $('settleDay').hidden=c.phase!=='open';$('settleDay').disabled=active||!s.pillEnded||!!window.AlchemyInteractionBusy;
 if(active)dayConfirm=false;
 $('settleDay').textContent=dayConfirm?'确认收工，进入日结':'敲铃 · 结束今日';
 $('nextDay').hidden=c.phase!=='settled';$('nextDay').textContent=`迎接第 ${c.day+1} 天`;
 const total=c.history.reduce((n,d)=>n+d.completed,0); const totalOrders=c.history.reduce((n,d)=>n+d.completed+d.failed,0);
 $('dailySummary').textContent=c.phase==='finished'?`三十日总评：完成 ${total} / ${totalOrders} 单，未完成 ${totalOrders-total} 单。累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。`:c.phase==='settled'?`今日结算：完成 ${completed} 单，未完成 ${c.orders.length-completed} 单；成丹归客；成功余药已赠留，失败余药已退回。`:active&&!s.pillEnded?'日结或终止委托前，请先处理炉内丹药。':'';
}
board.addEventListener('click',e=>{const letter=e.target.closest('[data-letter]');if(letter){selectedId=letter.dataset.letter;render();return;}if(e.target.closest('[data-return-forge]')){window.dispatchEvent(new Event('alchemy:work'));return;}const target=e.target.closest('[data-order]');if(target&&!target.disabled){abandonConfirm=false;api.chooseOrder(target.dataset.order);}});
$('abandonOrder').addEventListener('click',()=>{if(!abandonConfirm){abandonConfirm=true;render();}else{abandonConfirm=false;api.abandonOrder();}});
$('settleDay').addEventListener('click',()=>{if(dayConfirm){dayConfirm=false;api.endDay();}else{dayConfirm=true;render();$('dailySummary').textContent='收工后，未接委托会跳过，不计失败。确认结束今日吗？';}});$('nextDay').addEventListener('click',()=>{abandonConfirm=false;api.nextDay();});
$('restartButton').textContent='重新经营';
$('restartButton').addEventListener('click',e=>{if(api.snapshot().started&&!restartConfirm){e.preventDefault();e.stopImmediatePropagation();restartConfirm=true;$('restartButton').textContent='确认重开30天？';}else{restartConfirm=false;$('restartButton').textContent='重新经营';}},true);
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();

