(() => {
const api=window.AlchemyGame, header=document.querySelector('.game-layout');
const board=document.createElement('section');board.className='daily-board counter-board';
board.innerHTML=`<div class="daily-heading"><div><small>散修丹坊 · 三十日经营</small><h2 id="dayTitle">第 1 天 / 30 天</h2></div><strong id="careerTotal"></strong></div><p id="dailyHint" role="status"></p><div class="counter-scene"><div class="counter-sign">来客代炼 · 一笺一炉</div><div id="dailyOrders" class="counter-tickets" aria-label="今日客人来笺"></div><div class="counter-desk"><div id="counterLetter" class="counter-letter"></div><div class="counter-props"><div id="counterVisitor" class="counter-visitor" aria-live="polite"></div><div class="counter-parcels" id="counterParcels" aria-label="客人托付的三包药材"><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/></div><p id="counterParcelHint">客料暂寄柜上<br>接下后移交炼丹台</p><div class="counter-receipt" id="counterReceipt"></div></div></div></div><div class="daily-actions"><button id="abandonOrder" type="button">终止本单 · 免赔</button><button id="settleDay" type="button">结束今日</button><button id="nextDay" type="button" hidden>次日开门</button></div><div id="dailySummary" role="status"></div>`;
header.prepend(board);
let abandonConfirm=false,restartConfirm=false,selectedId=null;
const $=id=>document.getElementById(id);
const visitorTypes={'坊市行商':0,'驿路信使':0,'渡口船客':0,'远行修士':1,'守夜修士':1,'游学弟子':1,'闭关散修':1,'探洞修士':1,'采药散修':2,'山间药农':2};
const labels={pending:'待接单',active:'炼制中',completed:'已完成',failed:'未完成',skipped:'未接' };
function render(){const c=api.campaign();if(!c)return;const s=api.snapshot(),completed=c.orders.filter(o=>o.status==='completed').length,resolved=c.orders.filter(o=>['completed','failed'].includes(o.status)).length,active=!!(c.selfOrder?.status==='active'||c.orders.some(o=>o.status==='active'));
 $('dayTitle').textContent=`第 ${c.day} 天 / 30 天`;
 $('careerTotal').textContent=`累计完成 ${c.history.reduce((n,d)=>n+d.completed,0)+(c.phase==='open'?completed:0)} 单`;
 $('dailyHint').textContent=c.phase==='finished'?`三十日累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。查看总评，或重新经营。`:c.phase==='settled'?'今日已结清，准备迎接下一天。':`今日 ${completed} / ${c.orders.length} 单完成 · ${resolved} / ${c.orders.length} 单已处理。一次只接一单，成丹与余料归客人，失败免赔。`;
 if(!c.orders.some(o=>o.id===selectedId))selectedId=c.orders.find(o=>o.status==='active')?.id||c.orders.find(o=>o.status==='pending')?.id||c.orders[0]?.id;
 const selected=c.orders.find(o=>o.id===selectedId);
 $('dailyOrders').innerHTML=c.orders.map((o,i)=>`<button type="button" class="counter-ticket ${o.status} ${o.id===selectedId?'selected':''}" data-letter="${o.id}" aria-pressed="${o.id===selectedId}"><small>来笺 ${i+1} · ${labels[o.status]}</small><strong>${o.client}</strong><span>${o.name}</span></button>`).join('');
 if(selected){const o=selected,delivered=Math.round(o.status==='active'?s.delivered:o.delivered||0),canAccept=!active&&c.phase==='open'&&o.status==='pending'&&!window.AlchemyInteractionBusy&&!s.busy;
 $('counterLetter').innerHTML=`<span class="letter-kicker">来客手书 · ${labels[o.status]}</span><h3>${o.name}</h3><p class="letter-salutation">掌柜亲启：</p><p>在下${o.client}，托付${o.materials}包${({warm:'温性',cool:'寒性',neutral:'平性'}[o.nature]||'平性')}药材，请代炼成丹。</p><dl><div><dt>所求丹值</dt><dd>${o.target}</dd></div><div><dt>约定工钱</dt><dd>${window.AlchemyEconomy?.fee(o)||0} 铜钱</dd></div></dl><p class="letter-terms">成丹归客，未成免赔。成功后，未用药材赠予掌柜。</p><p class="letter-signature">—— ${o.client} 敬托</p><div class="counter-seal ${o.status}">${labels[o.status]}</div>${o.status==='pending'?`<button class="accept-stamp" type="button" data-order="${o.id}" ${canAccept?'':'disabled'}>${canAccept?'落印接下':active?'先办妥手中委托':'今日已收柜'}</button>`:o.status==='active'?'<button class="accept-stamp" type="button" data-return-forge>携料回炉 ›</button>':'<p class="letter-closed">此笺已归档，可翻看其他来笺。</p>'}`;
 const away=['completed','failed','skipped'].includes(o.status),visitorKey=o.id+o.status;
 const visitor=$('counterVisitor');if(visitor.dataset.visitorKey!==visitorKey){visitor.dataset.visitorKey=visitorKey;visitor.classList.toggle('is-away',away);const dialogue=o.status==='pending'?`掌柜，这${o.materials}包药材就托付给你了，炼到丹值${o.target}便好。`:o.status==='active'?'我就在柜边候着。掌柜量力而行，莫为赶单伤了丹药。':o.status==='completed'?'丹药收到了，多谢掌柜。余下的药材便留给你吧。':o.status==='failed'?'炼丹总有失手，无须赔药。成丹与余料我领回了，改日再来。':'今日未能托付，改日再来。';visitor.innerHTML=`<div class="visitor-dialogue"><strong>${o.client}${away?' · 留言':' · 正在柜前'}</strong><p>${dialogue}</p></div>${away?'<div class="visitor-departed">客人已离柜 · 此笺留档</div>':`<div class="visitor-portrait visitor-type-${visitorTypes[o.client]??0}" role="img" aria-label="${o.client}在柜前等候"></div>`}`;}
 const parcelCount=o.status==='pending'?o.materials:o.status==='active'?Math.max(0,o.materials-s.attempt):Math.max(0,o.gifted||o.returned||0);$('counterParcels').innerHTML=Array.from({length:parcelCount},()=>'<img src="assets/runtime-v10/herb-parcel-v1.webp" alt="药材包"/>').join('');$('counterParcelHint').textContent=o.status==='pending'?'客料暂寄柜上 · 落印后领料':o.status==='active'?`已领至炉台 · 剩余 ${parcelCount} 包`:o.gifted?'余药已赠留掌柜':'成丹与余料已归客';
 $('counterReceipt').textContent=o.status==='pending'?'待落印 · 尚未领料':o.status==='active'?`柜台收讫丹值 ${delivered} / ${o.target}`:`交付丹值 ${delivered} · ${o.gifted?'赠留余药 '+o.gifted+' 包':'归还余料 '+(o.returned||0)+' 包'}`;
 }

 $('abandonOrder').hidden=!active;
 $('abandonOrder').disabled=s.busy||!s.pillEnded||!!window.AlchemyInteractionBusy;
 $('abandonOrder').textContent=abandonConfirm?'确认终止并退还材料':'终止本单 · 免赔';
 $('settleDay').hidden=c.phase!=='open';$('settleDay').disabled=active||!s.pillEnded||!!window.AlchemyInteractionBusy;
 $('settleDay').textContent='敲铃 · 结束今日（未接委托跳过）';
 $('nextDay').hidden=c.phase!=='settled';$('nextDay').textContent=`迎接第 ${c.day+1} 天`;
 const total=c.history.reduce((n,d)=>n+d.completed,0); const totalOrders=c.history.reduce((n,d)=>n+d.completed+d.failed,0);
 $('dailySummary').textContent=c.phase==='finished'?`三十日总评：完成 ${total} / ${totalOrders} 单，未完成 ${totalOrders-total} 单。累计收入 ${c.economy?.earned||0} 铜钱，余额 ${c.economy?.coins||0} 铜钱。经营结束。`:c.phase==='settled'?`今日结算：完成 ${completed} 单，未完成 ${c.orders.length-completed} 单；已有成丹及未用材料均交还各自客人。`:active&&!s.pillEnded?'日结或终止委托前，请先处理炉内丹药。':'';
}
board.addEventListener('click',e=>{const letter=e.target.closest('[data-letter]');if(letter){selectedId=letter.dataset.letter;render();return;}if(e.target.closest('[data-return-forge]')){window.dispatchEvent(new Event('alchemy:work'));return;}const target=e.target.closest('[data-order]');if(target&&!target.disabled){abandonConfirm=false;api.chooseOrder(target.dataset.order);}});
$('abandonOrder').addEventListener('click',()=>{if(!abandonConfirm){abandonConfirm=true;render();}else{abandonConfirm=false;api.abandonOrder();}});
$('settleDay').addEventListener('click',()=>api.endDay());$('nextDay').addEventListener('click',()=>{abandonConfirm=false;api.nextDay();});
$('restartButton').textContent='重新经营';
$('restartButton').addEventListener('click',e=>{if(api.snapshot().started&&!restartConfirm){e.preventDefault();e.stopImmediatePropagation();restartConfirm=true;$('restartButton').textContent='确认重开30天？';}else{restartConfirm=false;$('restartButton').textContent='重新经营';}},true);
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();

