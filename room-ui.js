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
  const selfStart=document.createElement('button');selfStart.type='button';selfStart.id='settlementSelfStart';
  document.getElementById('roomSettlement').querySelector('[data-destination="shop"]').before(selfStart);
  selfStart.onclick=()=>window.dispatchEvent(new Event('alchemy:self-select'));
  const bagButton=document.createElement('button');bagButton.type='button';bagButton.dataset.destination='bag';bagButton.textContent='查看丹药背包';document.getElementById('roomSettlement').append(bagButton);
  document.getElementById('roomChoices').addEventListener('click',e=>{const b=e.target.closest('[data-rune]');if(b){window.AlchemyGame.economyAction('chooseRune',b.dataset.rune);document.getElementById('alchemyScene').focus({preventScroll:true});}});
  document.getElementById('roomSettlement').addEventListener('click',e=>{const b=e.target.closest('[data-destination]');if(b){if(b.dataset.destination==='orders')window.dispatchEvent(new Event('alchemy:next-customer'));document.querySelector('.engine-nav [data-view="'+b.dataset.destination+'"]').click();}});
  let triggerKey = '', triggerTimer;
  function update() {
    const s = window.AlchemyGame.snapshot();
    const c=window.AlchemyGame.campaign(),E=window.AlchemyEconomy;
    const live = s.started && !s.pillEnded && !s.roundEnded;
    const choices=document.getElementById('roomChoices'),settlement=document.getElementById('roomSettlement');
    choices.hidden=!s.runeChoices?.length;
    choices.querySelector('div').replaceChildren(...(s.runeChoices||[]).map(name=>{const b=document.createElement('button');b.dataset.rune=name;b.textContent='凝成'+name;return b;}));
    settlement.hidden=!s.roundEnded||!s.order;
    if(!settlement.hidden){const o=s.order;settlement.querySelector('p').textContent=o.self?(s.endReason==='explode'?'自炼炸丹 · 本炉没有成丹入库':'自炼完成 · 成丹已收入丹药背包，可保留或手动出售'):window.AlchemyCustomers.settlement(o);}
    bagButton.hidden=!s.order?.self||s.endReason!=='collect'||!c?.economy?.pills?.length;
    selfStart.hidden=c?.phase!=='open'||(!Object.values(c?.economy?.herbs||{}).some(n=>n>0)&&!(c?.economy?.stock||[]).some(n=>n>0));
    const purchase=settlement.querySelector('[data-destination="shop"]');purchase.hidden=!selfStart.hidden;purchase.textContent='去坊市购料';
    selfStart.textContent=s.order?.gifted?'用赠留药材自炼 · 成丹存入背包':'选自有药材自炼 · 成丹存入背包';
    decision.textContent=live?(s.order?.self?`收丹存入背包 · 当前可售估价 ${E.saleValue(c,s)} 铜钱`:`收丹后交付 ${Math.round(s.delivered+s.value)} / ${s.target} · ${s.delivered+s.value>=s.target?'可完成本单':'尚差 '+Math.ceil(s.target-s.delivered-s.value)}`):'';
    stock.textContent=live?(s.order?.self?'':`已交 ${Math.round(s.delivered)} / ${s.target} · 未投药材 ${s.remaining} 包`):'';
    stock.hidden=!stock.textContent;
    document.body.classList.toggle('info-live',live);document.body.classList.toggle('info-ended',s.roundEnded);
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
      name.textContent = label; number.textContent = value; row.dataset.fact=label;row.append(name, number); facts.append(row);
    }
    document.getElementById('roomRunes').textContent = live ? document.getElementById('runeSummary').textContent : '';
    document.getElementById('fireLabel').textContent = s.busy ? '炼化中' : '炼化';
    document.getElementById('fireHint').textContent = '点器具或炉口继续炼化';
    if (live && !s.busy && !window.AlchemyInteractionBusy && !stage.dataset.held) document.getElementById('workInstruction').textContent = '点击火门扇风 · 从炉口取丹放入收丹盘';
    document.getElementById('trayHint').textContent = s.order?.self ? '收丹存入背包 · 不自动出售' : '收丹计入本单';
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



