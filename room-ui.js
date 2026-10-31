(() => {
  const forge = document.querySelector('.forge-panel');
  const stage = document.getElementById('pillStage');
  document.body.classList.add('painted-room');
  forge.dataset.room = 'true';
  stage.insertAdjacentHTML('beforeend', '<section class="room-observation" aria-label="炉中丹药"><h2>炉中丹药</h2><div id="roomFacts"></div><p id="roomRunes"></p><small>从炉口取丹放入收丹盘</small></section><p class="room-empty" id="roomEmpty" role="status"></p>');
  const fire = document.getElementById('fireObject');
  fire.insertAdjacentHTML('afterbegin', '<img class="room-tool" src="assets/runtime-v10/alchemy-fan-v1.webp" alt="" draggable="false">');
  document.querySelector('.tray-object b').textContent = '收丹盘';
  stage.insertAdjacentHTML('beforeend', '<section id="roomChoices" class="room-loop-card" hidden aria-label="选择丹纹"><strong>灵性显纹 · 选择一道丹纹</strong><div></div></section><section id="roomSettlement" class="room-loop-card" hidden aria-live="polite"><p></p><button data-destination="orders">接待下一位客人</button> <button data-destination="shop">看看余药与坊市</button></section>');
  const decision=document.createElement('p');decision.id='roomDecision';document.querySelector('.room-observation').append(decision);
  const stock=document.createElement('p');stock.id='roomStock';document.querySelector('.room-observation').append(stock);
  document.getElementById('roomChoices').addEventListener('click',e=>{const b=e.target.closest('[data-rune]');if(b){window.AlchemyGame.economyAction('chooseRune',b.dataset.rune);document.getElementById('alchemyScene').focus({preventScroll:true});}});
  document.getElementById('roomSettlement').addEventListener('click',e=>{const b=e.target.closest('[data-destination]');if(b)document.querySelector('.engine-nav [data-view="'+b.dataset.destination+'"]').click();});
  let triggerKey = '', triggerTimer;
  function update() {
    const s = window.AlchemyGame.snapshot();
    const c=window.AlchemyGame.campaign(),E=window.AlchemyEconomy;
    const live = s.started && !s.pillEnded && !s.roundEnded;
    const choices=document.getElementById('roomChoices'),settlement=document.getElementById('roomSettlement');
    choices.hidden=!s.runeChoices?.length;
    choices.querySelector('div').replaceChildren(...(s.runeChoices||[]).map(name=>{const b=document.createElement('button');b.dataset.rune=name;b.textContent='凝成'+name;return b;}));
    settlement.hidden=!s.roundEnded||!s.order;
    if(!settlement.hidden){const o=s.order;settlement.querySelector('p').textContent=o.self?(c?.economy?.last||'自炼已结算'):o.status==='completed'?`本单完成 · 工钱 ${E.fee(o)} + 加赏 ${Math.max(0,(o.reward||0)-E.fee(o))} 铜钱 · 赠留余药 ${o.gifted||0} 包`:`本单未完成 · 失败免赔 · 退回余药 ${o.returned||0} 包，已有成丹归客`;}
    decision.textContent=live?(s.order?.self?`现在收丹实收 ${E.saleValue(c,s)} 铜钱`:`收丹后交付 ${Math.round(s.delivered+s.value)} / ${s.target} · ${s.delivered+s.value>=s.target?'可完成本单':'尚差 '+Math.ceil(s.target-s.delivered-s.value)}`):'';
    stock.textContent=live?`已交 ${Math.round(s.delivered)} / ${s.target} · 未投药材 ${s.remaining} 包`:'';
    stage.dataset.live = String(live);
    stage.dataset.loading = String(!!s.busy);
    document.querySelector('.room-observation').hidden = !live;
    document.getElementById('roomEmpty').hidden = true;
    document.getElementById('roomEmpty').textContent = !s.order ? '尚未接单 · 前往柜台接待客人' : s.roundEnded ? '本炉已结清 · 可返回柜台或开始下一炉' : '空炉待投料 · 从药柜取药包投入炉口';
    document.getElementById('herbObject').hidden = live || !s.order || s.roundEnded || s.remaining <= 0;
    fire.hidden = !live;
    document.getElementById('trayObject').hidden = !live;
    document.getElementById('trayPills').hidden = true;
    document.getElementById('deliverySeals').hidden = true;
    const facts = document.getElementById('roomFacts');
    facts.replaceChildren();
    if (live) for (const [label, value] of [['转数', `${s.turn}转`], ['品质', document.getElementById('qualityValue').textContent], ['当前丹值', String(Math.round(s.value))], ['炸丹概率', document.getElementById('riskResultValue').textContent]]) {
      const row = document.createElement('div'), name = document.createElement('span'), number = document.createElement('strong');
      name.textContent = label; number.textContent = value; row.append(name, number); facts.append(row);
    }
    document.getElementById('roomRunes').textContent = live ? document.getElementById('runeSummary').textContent : '';
    document.getElementById('fireLabel').textContent = s.busy ? '炼化中' : '炼化';
    document.getElementById('fireHint').textContent = '点器具或炉口继续炼化';
    if (live && !s.busy && !window.AlchemyInteractionBusy && !stage.dataset.held) document.getElementById('workInstruction').textContent = '点击火门扇风 · 从炉口取丹放入收丹盘';
    document.getElementById('trayHint').textContent = s.order?.self ? '收丹即出售 · 按实际售价结算' : '收丹计入本单';
    document.querySelector('.herb-object b').textContent = s.order?.self ? '自有药包' : '本单药包';
    document.querySelector('.commission-slip').hidden = live || !s.order || s.roundEnded;
    const triggers = document.getElementById('runeTriggerStatus');
    triggers.hidden = !live || !triggers.textContent.trim();
    if (!live) triggers.textContent = '';
    document.getElementById('valueChange').hidden = !live;
    const key = live ? `${s.attempt}:${s.turn}:${s.toolProgress?.triggers?.join('|')}:${s.runes?.join('|')}` : '';
    if (key !== triggerKey) {
      triggerKey = key;
      clearTimeout(triggerTimer);
      triggerTimer = setTimeout(() => { triggers.hidden = true; }, 2400);
    }
  }
  window.addEventListener('alchemy:render', update);
  window.addEventListener('alchemy:order', update);
  update();
})();



