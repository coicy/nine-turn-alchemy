(() => {
  'use strict';
  const api=window.AlchemyGame,E=window.AlchemyEconomy,panel=document.createElement('section');panel.className='pill-bag-panel';panel.setAttribute('aria-labelledby','pillBagTitle');
  panel.innerHTML='<header class="pill-bag-heading"><div><h2 id="pillBagTitle">丹药背包</h2><p id="pillBagCount"></p></div><button type="button" data-bag-return>返回炼丹台</button></header><p id="pillBagStatus" role="status"></p><div id="pillBagList"></div>';
  document.querySelector('.game-layout').append(panel);
  function render(){
    const c=api.campaign();if(!c){panel.hidden=true;return;}if(!document.body.classList.contains('engine-shell'))panel.hidden=false;
    const e=E.ensure(c),list=panel.querySelector('#pillBagList');list.replaceChildren();
    if(!Array.isArray(e.pills)){panel.querySelector('#pillBagCount').textContent='背包记录异常，原数据已保留';return;}
    panel.querySelector('#pillBagCount').textContent=`持有 ${e.pills.length} 颗`;
    if(!e.pills.length){const empty=document.createElement('p');empty.className='pill-bag-empty';empty.textContent='背包里还没有成丹。用自有药材开炉，收丹后即可在这里查看。';list.append(empty);return;}
    for(const pill of e.pills){
      if(!pill||typeof pill.id!=='string')continue;
      const card=document.createElement('article');card.className='pill-bag-card';card.dataset.pillId=pill.id;
      const art=document.createElement('div');art.className='pill-bag-art';const runes=Array.isArray(pill.runes)?pill.runes:[];
      const selection=window.AlchemyPillArt.selection(pill.nature,pill.quality,runes);
      for(const src of [selection.body,...selection.cracks]){const img=document.createElement('img');img.src=src;img.alt='';art.append(img);}
      const title=document.createElement('h3');title.textContent=`${pill.turn}转 · ${['凡品','良品','上品','极品','绝品'][pill.quality]||'品质未记录'}灵丹`;
      const facts=document.createElement('p');facts.textContent=`${({warm:'温性',cool:'寒性',neutral:'平性'}[pill.nature]||'药性未记录')} · 丹值 ${pill.value} · 第 ${pill.day} 天收丹`;
      const marks=document.createElement('p');marks.textContent='丹纹：'+(runes.length?runes.join('、'):'无');
      const sell=document.createElement('button');sell.type='button';sell.dataset.sellPill=pill.id;sell.textContent=`出售这颗 · ${E.saleValue(c,pill)} 铜钱`;sell.disabled=api.snapshot().busy||!!window.AlchemyInteractionBusy||!!window.AlchemyScene2D?.busy;
      card.append(art,title,facts);if(runes.length)card.append(marks);card.append(sell);list.append(card);
    }
  }
  panel.addEventListener('click',e=>{if(e.target.closest('[data-bag-return]')){window.dispatchEvent(new Event('alchemy:work'));return;}const b=e.target.closest('[data-sell-pill]');if(!b||b.disabled)return;const ok=api.economyAction('sell',b.dataset.sellPill);panel.querySelector('#pillBagStatus').textContent=ok?api.campaign().economy.last:'未出售，请重新查看当前背包与操作状态。';});
  let noticeTimer;panel.addEventListener('click',()=>{clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{panel.querySelector('#pillBagStatus').textContent='';},2400);});window.addEventListener('alchemy:view-ready',e=>{if(e.detail.view!=='bag')panel.querySelector('#pillBagStatus').textContent='';});window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
