(() => {
  'use strict';
  const api=window.AlchemyGame,stage=document.getElementById('pillStage');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='refine-odds-toggle';toggle.textContent='查看炼丹全部结果概率';toggle.setAttribute('aria-controls','refineOdds');stage.append(toggle);
  const panel=document.createElement('aside');panel.id='refineOdds';panel.className='refine-odds';panel.setAttribute('aria-labelledby','refineOddsTitle');
  panel.innerHTML='<header><h2 id="refineOddsTitle">炼丹结果概率</h2><button type="button" aria-label="收起炼丹概率窗口">收起 ×</button></header><p id="refineOddsState"></p><dl></dl><p id="refineOddsProtection"></p><details><summary>生纹与融合如何发生？</summary><p>生纹是成功后的附加效果：普通成功有25%自然生纹，大成功有50%。生纹针、合璧镜及灵性药包可提供额外保障；六道纹已满或没有可生成的基础纹时不再新增。满足赤青或月雷组合时自动融合，回纹环按自身条件补纹。这些效果不与上述五类结果相加。</p></details><small>五类结果互斥，合计100%；显示值经四舍五入。概率随转数、法器与本炉护丹状态更新。</small>';
  const definitions=[['big','大成功','升转并提升丹值'],['success','炼化成功','升转并提升丹值'],['hold','火候维持','保持转数'],['damage','丹体受损','回落一转，丹值受损'],['explode','炸丹','损失当前炉内丹药']];
  const rows=definitions.map(([id,label,description])=>{const row=document.createElement('div');row.dataset.outcome=id;const name=document.createElement('dt'),value=document.createElement('dd'),hint=document.createElement('small');name.textContent=label;hint.textContent=description;row.append(name,value,hint);panel.querySelector('dl').append(row);return {id,value};});
  stage.append(panel);let open=true;
  function fit(){
    const narrow=innerWidth<=650,host=narrow?document.body:stage;
    if(panel.parentElement!==host){host.append(panel,toggle);}
    for(const el of [panel,toggle])el.classList.toggle('mobile-odds',narrow);
    if(narrow){const top=document.querySelector('.engine-nav').getBoundingClientRect().bottom+8,canvas=document.getElementById('alchemyScene'),r=canvas.getBoundingClientRect(),mouth=window.AlchemyScene2D.mouth,preview=document.querySelector('.observation-pill').getBoundingClientRect();panel.style.top=toggle.style.top=top+'px';panel.style.maxHeight=Math.max(120,Math.min(430,Math.min(r.top+mouth.y*r.width/canvas.width,preview.top)-top-10))+'px';}
    else {panel.style.top=toggle.style.top='';panel.style.maxHeight='';}
  }
  function update(){
    const s=api.snapshot(),p=api.refinementProbabilities(),live=s.started&&!s.pillEnded&&!s.roundEnded;
    const atWork=window.AlchemyViewState.snapshot().current==='work';
    toggle.hidden=!live||!atWork;toggle.setAttribute('aria-expanded',String(open));panel.hidden=!live||!open||!atWork;
    toggle.textContent=open?'收起炼丹概率窗口':'查看炼丹全部结果概率';
    panel.querySelector('#refineOddsState').textContent=s.turn>=100?'百转已成，请收丹。':s.busy?'本次炼化结算中…':s.runeChoices?.length?'请先完成丹纹选择，再继续炼化。':`下一次炼化 · 当前 ${s.turn} 转`;
    rows.forEach(({id,value})=>{value.textContent=p.available?(p.outcomes[id]*100).toFixed(1)+'%':'—';});
    panel.querySelector('#refineOddsProtection').textContent=p.protection?`${p.protection.name}：原本 ${(p.baseExplosion*100).toFixed(1)}% 的炸丹将转为${p.protection.outcome==='damage'?'受损':'维持'}，已计入上表。`:'已计入法器减险与结果权重；本次没有可抵挡炸丹的保护。';
    requestAnimationFrame(fit);
  }
  toggle.onclick=()=>{open=!open;update();if(open)panel.querySelector('button').focus({preventScroll:true});};
  panel.querySelector('button').onclick=()=>{open=false;update();toggle.focus({preventScroll:true});};
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();open=false;update();toggle.focus({preventScroll:true});}});
  window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:view-ready',update);window.addEventListener('resize',()=>requestAnimationFrame(fit));fit();update();
})();
