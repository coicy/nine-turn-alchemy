(() => {
  'use strict';
  const api=window.AlchemyGame,stage=document.getElementById('pillStage');
  const toggle=document.createElement('button');toggle.type='button';toggle.className='refine-odds-toggle';toggle.textContent='查看炼丹全部结果概率';toggle.setAttribute('aria-controls','refineOdds');stage.append(toggle);
  const panel=document.createElement('aside');panel.id='refineOdds';panel.className='refine-odds';panel.setAttribute('aria-labelledby','refineOddsTitle');
  panel.innerHTML='<header><h2 id="refineOddsTitle">炼丹结果概率</h2><button type="button" aria-label="收起炼丹概率窗口">收起 ×</button></header><p id="refineOddsState"></p><dl></dl><p id="refineOddsProtection"></p><details><summary>概率与生纹说明</summary><p>五类结果互斥，合计100%；显示经四舍五入，色带使用实际概率。生纹是成功后的附加效果：普通成功有25%自然生纹，大成功有50%。生纹针、合璧镜及灵性药包可提供额外保障；六道纹已满或没有可生成的基础纹时不再新增。满足赤青或月雷组合时自动融合，回纹环按自身条件补纹。这些效果不与上述五类结果相加。</p></details>';
  const definitions=[['explode','炸丹','损失当前炉内丹药'],['damage','受损','回落一转，丹值受损'],['hold','维持','保持转数'],['success','成功','升转并提升丹值'],['big','大成功','升转并提升丹值']];
  const bar=document.createElement('div');bar.className='chance-bar';bar.setAttribute('aria-hidden','true');panel.querySelector('dl').after(bar);
  const result=document.createElement('p');result.id='refineOddsResult';result.setAttribute('role','status');bar.after(result);
  const rows=definitions.map(([id,label,description])=>{const row=document.createElement('div');row.dataset.outcome=id;row.title=description;const name=document.createElement('dt'),value=document.createElement('dd');name.textContent=label;row.append(name,value);panel.querySelector('dl').append(row);const segment=document.createElement('span');segment.className='chance-segment';segment.dataset.outcome=id;bar.append(segment);return {id,label,row,value,segment};});
  stage.append(panel);let open=true,lastOutcome=null,pillKey='';
  function fit(){
    const narrow=innerWidth<=650,host=narrow?document.body:stage;
    if(panel.parentElement!==host){host.append(panel,toggle);}
    for(const el of [panel,toggle])el.classList.toggle('mobile-odds',narrow);
    if(window.AlchemyWorldUI){return;}
    if(narrow){const observation=document.querySelector('.room-observation'),top=(observation.classList.contains('mobile-info')&&!observation.hidden?observation.getBoundingClientRect().bottom:document.querySelector('.engine-nav').getBoundingClientRect().bottom)+8,canvas=document.getElementById('alchemyScene'),r=canvas.getBoundingClientRect(),mouth=window.AlchemyScene2D.mouth,preview=document.querySelector('.observation-pill');panel.style.top=toggle.style.top=top+'px';panel.style.maxHeight=Math.max(120,Math.min(430,r.top+mouth.y*r.width/canvas.width-top-10))+'px';}
    else {panel.style.top=toggle.style.top='';panel.style.maxHeight='';}
  }
  function update(){
    const s=api.snapshot(),p=api.refinementProbabilities(),live=s.started&&!s.pillEnded&&!s.roundEnded;
    const key=s.orderId+':'+s.attempt;if(key!==pillKey||s.busy||s.endReason==='collect'){lastOutcome=null;pillKey=key;}
    const visible=live||lastOutcome==='explode';
    const atWork=window.AlchemyViewState.snapshot().current==='work';
    toggle.hidden=!visible||!atWork||open;toggle.setAttribute('aria-expanded',String(open));panel.hidden=!visible||!open||!atWork;
    toggle.textContent=open?'收起炼丹概率窗口':'查看炼丹全部结果概率';
    panel.querySelector('#refineOddsState').textContent=s.endReason==='explode'?'本炉炸丹，概率已清空。':s.turn>=100?'百转已成，请收丹。':s.busy?'本次炼化结算中…':s.runeChoices?.length?'请先完成丹纹选择，再继续炼化。':'下一次炼化';
    rows.forEach(({id,row,value,segment})=>{value.textContent=p.available?(p.outcomes[id]*100).toFixed(1)+'%':'—';segment.style.width=(p.available?p.outcomes[id]*100:0)+'%';row.dataset.hit=String(lastOutcome===id);});
    result.hidden=!lastOutcome;result.textContent=lastOutcome?'上次结果：'+definitions.find(([id])=>id===lastOutcome)[1]:'';
    panel.querySelector('#refineOddsProtection').hidden=!p.available||!p.protection;panel.querySelector('#refineOddsProtection').textContent=p.protection?`${p.protection.name}：原本 ${(p.baseExplosion*100).toFixed(1)}% 的炸丹将转为${p.protection.outcome==='damage'?'受损':'维持'}，已计入上表。`:'';
    document.body.classList.toggle('odds-expanded',visible&&open&&atWork);requestAnimationFrame(fit);
  }
  toggle.onclick=()=>{open=!open;update();if(open)panel.querySelector('button').focus({preventScroll:true});};
  panel.querySelector('button').onclick=()=>{open=false;update();toggle.focus({preventScroll:true});};
  panel.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();open=false;update();toggle.focus({preventScroll:true});}});
  window.addEventListener('alchemy:refine-result',e=>{if(definitions.some(([id])=>id===e.detail?.outcome)){lastOutcome=e.detail.outcome;update();}});
  window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:view-ready',update);window.addEventListener('resize',()=>requestAnimationFrame(fit));fit();update();
})();
