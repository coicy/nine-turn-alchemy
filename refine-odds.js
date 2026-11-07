(() => {
 const api=window.AlchemyGame,stage=document.getElementById('pillStage'),toggle=document.createElement('button');toggle.type='button';toggle.className='refine-odds-toggle';toggle.textContent='展开五类概率';toggle.setAttribute('aria-controls','refineOdds');
 const panel=document.createElement('aside');panel.id='refineOdds';panel.className='refine-odds';panel.setAttribute('aria-labelledby','refineOddsTitle');panel.innerHTML='<header><h2 id="refineOddsTitle">下一次炼化</h2><button type="button" aria-label="收起炼丹概率窗口">收起 ×</button></header><p id="refineOddsState"></p><dl></dl><div class="chance-bar" aria-hidden="true"></div><p id="refineOddsProtection"></p><button class="odds-rules" type="button">查阅概率与生纹规则</button>';
 const definitions=[['explode','炸丹'],['damage','受损'],['hold','维持'],['success','成功'],['big','大成功']],rows=definitions.map(([id,label])=>{const row=document.createElement('div');row.dataset.outcome=id;row.innerHTML='<dt>'+label+'</dt><dd></dd>';panel.querySelector('dl').append(row);const segment=document.createElement('span');segment.className='chance-segment';segment.dataset.outcome=id;panel.querySelector('.chance-bar').append(segment);return {id,row,value:row.querySelector('dd'),segment};});
 stage.append(panel,toggle);let open=true,pillKey='',lastOutcome=null,timer;
 function update(){const s=api.snapshot(),p=api.refinementProbabilities(),key=s.orderId+':'+s.attempt;if(key!==pillKey){pillKey=key;open=true;lastOutcome=null;}if(s.busy)lastOutcome=null;
  const atWork=window.AlchemyViewState.snapshot().current==='work'&&window.AlchemyViewState.snapshot().workMode==='furnace',live=s.started&&!s.pillEnded&&!s.roundEnded,visible=live&&atWork&&!s.runeChoices?.length&&p.available;
  toggle.hidden=true;panel.hidden=!visible;toggle.setAttribute('aria-expanded',String(visible));document.body.classList.toggle('odds-expanded',visible);
  panel.querySelector('#refineOddsState').textContent=s.endReason==='explode'?'本炉炸丹':s.busy?'本次结算中…':'';
  rows.forEach(({id,row,value,segment})=>{value.textContent=p.available?(p.outcomes[id]*100).toFixed(1)+'%':'—';segment.style.width=(p.available?p.outcomes[id]*100:0)+'%';row.removeAttribute('data-hit');});
  const protection=panel.querySelector('#refineOddsProtection');protection.textContent=p.available&&p.protection?p.protection.name+(p.protection.name.endsWith('护丹')?'生效':'护丹生效'):'';protection.hidden=!protection.textContent;
  toggle.textContent='展开五类概率';
  let risk=toggle.querySelector('small');if(!risk){risk=document.createElement('small');toggle.append(risk);}risk.textContent=p.available?'炸丹 '+(p.outcomes.explode*100).toFixed(1)+'% · '+(p.protection?p.protection.name+(p.protection.name.endsWith('护丹')?'生效':'护丹生效'):'无护丹效果'):'';
  const narrow=innerWidth<=650,host=document.querySelector('.furnace-judgment')||(narrow?document.body:stage);for(const el of [panel,toggle]){if(el.parentElement!==host)host.append(el);el.classList.toggle('mobile-odds',narrow);}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 toggle.onclick=()=>{open=true;update();panel.querySelector('button').focus({preventScroll:true});};panel.querySelector('header button').onclick=()=>{open=false;update();toggle.focus({preventScroll:true});};
 panel.querySelector('.odds-rules').onclick=()=>window.AlchemyViewState.navigate('manual',{chapter:'probability'});
 // Five exact probabilities remain visible while another refinement is possible.
 window.addEventListener('alchemy:refine-result',e=>{lastOutcome=e.detail.outcome;clearTimeout(timer);update();if(lastOutcome!=='explode')timer=setTimeout(()=>{lastOutcome=null;update();},1800);});
 window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:view-ready',update);window.addEventListener('resize',update);update();
})();
