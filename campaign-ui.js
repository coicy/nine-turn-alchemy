(() => {
const api=window.AlchemyGame, header=document.querySelector('.game-layout');
const board=document.createElement('section');board.className='daily-board';
board.innerHTML=`<div class="daily-heading"><div><small>散修丹坊 · 三十日经营</small><h2 id="dayTitle">第 1 天 / 30 天</h2></div><strong id="careerTotal"></strong></div><p id="dailyHint" role="status"></p><div id="dailyOrders" class="daily-orders"></div><div class="daily-actions"><button id="abandonOrder" type="button">终止本单 · 免赔</button><button id="settleDay" type="button">结束今日</button><button id="nextDay" type="button" hidden>次日开门</button></div><div id="dailySummary" role="status"></div>`;
header.prepend(board);
let abandonConfirm=false,restartConfirm=false;
const $=id=>document.getElementById(id);
const labels={pending:'待接单',active:'炼制中',completed:'已完成',failed:'未完成'};
function render(){const c=api.campaign();if(!c)return;const s=api.snapshot(),completed=c.orders.filter(o=>o.status==='completed').length,resolved=c.orders.filter(o=>['completed','failed'].includes(o.status)).length,active=c.orders.some(o=>o.status==='active');
 $('dayTitle').textContent=`第 ${c.day} 天 / 30 天`;
 $('careerTotal').textContent=`累计完成 ${c.history.reduce((n,d)=>n+d.completed,0)+(c.phase==='open'?completed:0)} 单`;
 $('dailyHint').textContent=c.phase==='finished'?'三十日经营结束。查看总评，或重新经营。':c.phase==='settled'?'今日已结清，准备迎接下一天。':`今日 ${completed} / 3 单完成 · ${resolved} / 3 单已处理。一次只接一单，成丹与余料归客人，失败免赔。`;
 $('dailyOrders').innerHTML=c.orders.map(o=>`<article class="daily-order ${o.status}"><small>${o.client} · ${labels[o.status]}</small><h3>${o.name}</h3><p>目标 ${o.target} · 药材 ${o.materials} 包</p><p>${o.status==='pending'?'全部成丹归客 · 失败不赔药':`已交 ${Math.round(o.status==='active'?s.delivered:o.delivered)}${o.status==='completed'||o.status==='failed'?` · 退回余料 ${o.returned} 包`:''}`}</p><button type="button" data-order="${o.id}" ${active||c.phase!=='open'||o.status!=='pending'||window.AlchemyInteractionBusy?'disabled':''}>${o.status==='pending'?'接受委托':labels[o.status]}</button></article>`).join('');
 $('abandonOrder').hidden=!active;
 $('abandonOrder').disabled=s.busy||!s.pillEnded||!!window.AlchemyInteractionBusy;
 $('abandonOrder').textContent=abandonConfirm?'确认终止并退还材料':'终止本单 · 免赔';
 $('settleDay').hidden=c.phase!=='open';$('settleDay').disabled=active||resolved<3||!!window.AlchemyInteractionBusy;
 $('settleDay').textContent=resolved<3?'处理全部订单后日结':'敲铃 · 结束今日';
 $('nextDay').hidden=c.phase!=='settled';$('nextDay').textContent=`迎接第 ${c.day+1} 天`;
 const total=c.history.reduce((n,d)=>n+d.completed,0);
 $('dailySummary').textContent=c.phase==='finished'?`三十日总评：完成 ${total} / 90 单，未完成 ${90-total} 单。经营结束。`:c.phase==='settled'?`今日结算：完成 ${completed} 单，未完成 ${3-completed} 单；已有成丹及未用材料均交还各自客人。`:active&&!s.pillEnded?'日结或终止委托前，请先处理炉内丹药。':'';
}
$('dailyOrders').addEventListener('click',e=>{const target=e.target.closest('[data-order]');if(target&&!target.disabled){abandonConfirm=false;api.chooseOrder(target.dataset.order);}});
$('abandonOrder').addEventListener('click',()=>{if(!abandonConfirm){abandonConfirm=true;render();}else{abandonConfirm=false;api.abandonOrder();}});
$('settleDay').addEventListener('click',()=>api.endDay());$('nextDay').addEventListener('click',()=>{abandonConfirm=false;api.nextDay();});
$('restartButton').textContent='重新经营';
$('restartButton').addEventListener('click',e=>{if(api.snapshot().started&&!restartConfirm){e.preventDefault();e.stopImmediatePropagation();restartConfirm=true;$('restartButton').textContent='确认重开30天？';}else{restartConfirm=false;$('restartButton').textContent='重新经营';}},true);
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
