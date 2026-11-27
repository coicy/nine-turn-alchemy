(() => {
 const api=window.AlchemyGame,stage=document.getElementById('pillStage'),toggle=document.createElement('button');toggle.type='button';toggle.className='refine-odds-toggle';toggle.textContent='展开五类概率';toggle.setAttribute('aria-controls','refineOdds');
 const panel=document.createElement('aside');panel.id='refineOdds';panel.className='refine-odds';panel.setAttribute('aria-labelledby','refineOddsTitle');panel.innerHTML='<header><h2 id="refineOddsTitle">下一次炼化</h2><button type="button" aria-label="收起炼丹概率窗口">收起 ×</button></header><p id="refineOddsState"></p><p id="refineOddsRisk" class="refine-odds-risk"></p><dl></dl><div class="chance-bar" aria-hidden="true"></div><div class="odds-charge-strip" hidden></div><p id="refineOddsProtection" class="refine-odds-protection"></p><button class="odds-rules" data-focus-key="odds-rules" type="button">查阅炼化概率</button>';
 const definitions=[['explode','炸炉'],['damage','受损'],['hold','维持'],['success','成功'],['big','大成功']],rows=definitions.map(([id,label])=>{const row=document.createElement('div');row.dataset.outcome=id;row.innerHTML='<dt>'+label+'</dt><dd></dd>';panel.querySelector('dl').append(row);const segment=document.createElement('span');segment.className='chance-segment';segment.dataset.outcome=id;panel.querySelector('.chance-bar').append(segment);return {id,row,value:row.querySelector('dd'),segment};});
 stage.append(panel,toggle);let open=true,pillKey='',lastOutcome=null,timer;
 function riskCopy(p,s){
  if(!p.available)return '';
  const charge=`步罡蓄势 ${s?.ritualCharge??0}/${s?.ritualChargeTarget||9}`;
  if(p.safeRun)return `动作前炉险 ${(p.baseExplosion*100).toFixed(1)}% · 符火护炉，自动连炼剩余${p.safeRefines}次 · 最终炸炉 0.0%`;
  if(p.protection)return `动作前炉险 ${(p.baseExplosion*100).toFixed(1)}% · 保护后炸炉 ${(p.outcomes.explode*100).toFixed(1)}% · ${charge}`;
  return `${charge}`;
 }
 function protectionCopy(p){
  if(!p.available||!p.protection)return '';
  if(p.safeRun)return `本次不会炸炉 · ${p.protection.name}待命`;
  return `${p.protection.name}：炸炉转为${p.protection.outcome==='damage'?'受损':'维持'}`;
 }
 function update(){const s=api.snapshot(),p=api.refinementProbabilities(),key=s.orderId+':'+s.attempt;if(key!==pillKey){pillKey=key;open=true;lastOutcome=null;}if(s.busy)lastOutcome=null;
  const atWork=window.AlchemyViewState.snapshot().current==='work'&&window.AlchemyViewState.snapshot().workMode==='furnace',live=s.started&&!s.pillEnded&&!s.roundEnded,visible=live&&atWork&&p.available;
  toggle.hidden=!visible||open;panel.hidden=!visible||!open;toggle.setAttribute('aria-expanded',String(visible&&open));document.body.classList.toggle('odds-expanded',visible&&open);
  panel.querySelector('#refineOddsState').textContent=s.endReason==='explode'?'本炉炸炉':s.busy?'本次结算中…':'';
  const risk=panel.querySelector('#refineOddsRisk'),protection=panel.querySelector('#refineOddsProtection'),chargeStrip=panel.querySelector('.odds-charge-strip');
  let topId='success',topProb=0;
  if(p.available){rows.forEach(({id})=>{const pr=p.outcomes[id]||0;if(pr>topProb){topProb=pr;topId=id;}});}
  rows.forEach(({id,row,value,segment})=>{value.textContent=p.available?(p.outcomes[id]*100).toFixed(1)+'%':'—';segment.style.width=(p.available?p.outcomes[id]*100:0)+'%';row.removeAttribute('data-hit');row.dataset.top=(p.available&&topProb>0&&id===topId)?'true':'false';});
  const desktopWarm=innerWidth>650&&document.body.classList.contains('warm-cinnabar-experiment');
  if(desktopWarm&&p.available){
   const charge=s?.ritualCharge??0,target=s?.ritualChargeTarget||9;
   let pips='';for(let i=0;i<target;i++)pips+='<i class="odds-pip'+(i<charge?' is-on':'')+'"></i>';
   chargeStrip.innerHTML='<span>步罡蓄势 <b>'+charge+'/'+target+'</b></span><div class="odds-charge-pips" aria-hidden="true">'+pips+'</div>';
   chargeStrip.hidden=false;risk.hidden=true;
   if(p.safeRun)protection.textContent=(p.protection?p.protection.name+'待命 · ':'')+'符火护炉，自动连炼余 '+p.safeRefines+' 次（炸炉 0.0%）';
   else if(p.protection)protection.textContent=p.protection.name+'：炸炉转'+(p.protection.outcome==='damage'?'受损':'维持')+' · 原炉险 '+(p.baseExplosion*100).toFixed(1)+'%';
   else protection.textContent='';
   protection.hidden=!protection.textContent;
  }else{
   chargeStrip.hidden=true;
   risk.textContent=riskCopy(p,s);risk.hidden=!risk.textContent;
   protection.textContent=protectionCopy(p);protection.hidden=!protection.textContent;
  }
  toggle.textContent='展开五类概率';
  let toggleRisk=toggle.querySelector('small');if(!toggleRisk){toggleRisk=document.createElement('small');toggle.append(toggleRisk);}toggleRisk.textContent=p.available?'炉险 '+(p.baseExplosion*100).toFixed(1)+'% · 炸炉 '+(p.outcomes.explode*100).toFixed(1)+'%'+(p.safeRun?' · 符火连炼余'+p.safeRefines:` · 蓄势 ${s.ritualCharge??0}/${s.ritualChargeTarget||9}`):'';
  const narrow=innerWidth<=650,host=document.querySelector('.furnace-judgment')||(narrow?document.body:stage);for(const el of [panel,toggle]){if(el.parentElement!==host)host.append(el);el.classList.toggle('mobile-odds',narrow);}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 toggle.onclick=()=>{open=true;update();panel.querySelector('button').focus({preventScroll:true});};panel.querySelector('header button').onclick=()=>{open=false;update();toggle.focus({preventScroll:true});};
 panel.querySelector('.odds-rules').onclick=()=>window.AlchemyViewState.navigate('manual',{anchor:panel.querySelector('.odds-rules'),chapter:'probability'});
 // Five exact probabilities remain visible while another refinement is possible.
 window.addEventListener('alchemy:refine-result',e=>{lastOutcome=e.detail.outcome;clearTimeout(timer);update();if(lastOutcome!=='explode')timer=setTimeout(()=>{lastOutcome=null;update();},1800);});
 window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);window.addEventListener('alchemy:view-ready',update);window.addEventListener('resize',update);update();
})();
