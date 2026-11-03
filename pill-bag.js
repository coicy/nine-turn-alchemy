(() => {
'use strict';
const api=window.AlchemyGame,E=window.AlchemyEconomy,panel=document.createElement('section');panel.className='pill-bag-panel';panel.setAttribute('aria-labelledby','pillBagTitle');
panel.innerHTML='<header class="pill-bag-heading"><div><h2 id="pillBagTitle">丹药背包</h2><p id="pillBagCount"></p></div><button data-bag-return>合上丹匣</button></header><p id="pillBagStatus" role="status"></p><div id="pillBagList"></div><section id="pillBagSelected" aria-label="选中丹药详情"></section>';document.querySelector('.game-layout').append(panel);let selected=null;
function art(p){const a=window.AlchemyPillArt.selection(p.nature,p.quality,p.runes||[]);return '<div class="pill-bag-art">'+[a.body,...a.cracks].map(src=>'<img src="'+src+'" alt="">').join('')+'</div>';}
function render(){const c=api.campaign();if(!c){panel.hidden=true;return;}const e=E.ensure(c),list=panel.querySelector('#pillBagList'),detail=panel.querySelector('#pillBagSelected');if(!Array.isArray(e.pills)){panel.querySelector('#pillBagCount').textContent='背包记录异常，原数据已保留';return;}panel.querySelector('#pillBagCount').textContent='持有 '+e.pills.length+' 颗';
 if(!e.pills.some(p=>p.id===selected))selected=e.pills[0]?.id||null;
 list.innerHTML=e.pills.length?e.pills.map(p=>'<button class="pill-bag-card" data-pill-id="'+p.id+'" aria-pressed="'+(selected===p.id)+'" aria-label="查看'+p.turn+'转灵丹">'+art(p)+'<span>'+p.turn+'转</span></button>').join(''):'<p class="pill-bag-empty">丹匣尚空 · 自炼成丹存放于此</p>';
 const p=e.pills.find(p=>p.id===selected);detail.hidden=!p;if(!p){detail.replaceChildren();return;}
 detail.innerHTML=art(p)+'<h3>'+p.turn+'转 · '+['凡品','良品','上品','极品','绝品'][p.quality]+'灵丹</h3><p>'+({warm:'温性',cool:'寒性',neutral:'平性'}[p.nature]||'平性')+' · 丹值 '+p.value+' · 第 '+p.day+' 天收丹</p>'+((p.runes||[]).length?'<p>丹纹：'+p.runes.join('、')+'</p>':'')+'<button data-sell-pill="'+p.id+'" '+(api.snapshot().busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy?'disabled':'')+'>出售这颗 · '+E.saleValue(c,p)+' 铜钱</button>';
}
panel.addEventListener('click',e=>{if(e.target.closest('[data-bag-return]')){window.dispatchEvent(new Event('alchemy:close-reading'));return;}const pick=e.target.closest('[data-pill-id]');if(pick){selected=pick.dataset.pillId;render();return;}const b=e.target.closest('[data-sell-pill]');if(b&&!b.disabled){const ok=api.economyAction('sell',b.dataset.sellPill);panel.querySelector('#pillBagStatus').textContent=ok?api.campaign().economy.last:'未出售，请重新查看当前状态';}});
window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view!=='bag')panel.querySelector('#pillBagStatus').textContent='';});window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
