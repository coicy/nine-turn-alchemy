(() => {
  const forge = document.querySelector('.forge-panel');
  const stage = document.getElementById('pillStage');
  document.body.classList.add('painted-room');
  forge.dataset.room = 'true';
  stage.insertAdjacentHTML('beforeend', '<section class="room-observation" aria-label="炉中丹药"><h2>炉中丹药</h2><div id="roomFacts"></div><p id="roomRunes"></p><small>拖动丹药到收丹盘</small></section><p class="room-empty" id="roomEmpty" role="status"></p>');
  const fire = document.getElementById('fireObject');
  fire.insertAdjacentHTML('afterbegin', '<img class="room-tool" src="assets/runtime-v10/alchemy-fan-v1.webp" alt="" draggable="false">');
  document.querySelector('.tray-object b').textContent = '收丹盘';
  let triggerKey = '', triggerTimer;
  function update() {
    const s = window.AlchemyGame.snapshot();
    const live = s.started && !s.pillEnded && !s.roundEnded;
    stage.dataset.live = String(live);
    stage.dataset.loading = String(!!s.busy);
    document.querySelector('.room-observation').hidden = !live;
    document.getElementById('roomEmpty').hidden = true;
    document.getElementById('roomEmpty').textContent = !s.order ? '尚未接单 · 前往柜台接待客人' : s.roundEnded ? '本炉已结清 · 可返回柜台或开始下一炉' : '空炉待投料 · 将一份药包拖至炉口';
    document.getElementById('herbObject').hidden = live || !s.order || s.roundEnded || s.remaining <= 0;
    fire.hidden = !live;
    document.getElementById('trayObject').hidden = !live;
    document.getElementById('trayPills').hidden = true;
    document.getElementById('deliverySeals').hidden = true;
    document.getElementById('roomFacts').textContent = live ? `${s.turn}转 · ${document.getElementById('qualityValue').textContent}　当前价值 ${Math.round(s.value)}　下次炸丹 ${document.getElementById('riskResultValue').textContent}` : '';
    document.getElementById('roomRunes').textContent = live ? document.getElementById('runeSummary').textContent : '';
    document.getElementById('fireLabel').textContent = s.busy ? '炼化中' : '炼化';
    document.getElementById('fireHint').textContent = '点器具或炉口继续炼化';
    if (live && !s.busy && !window.AlchemyInteractionBusy) document.getElementById('workInstruction').textContent = '点击炼化器具继续 · 将丹药拖至收丹盘收取';
    document.getElementById('trayHint').textContent = s.order?.self ? '收丹即出售 · 按实际售价结算' : '收丹计入本单';
    document.querySelector('.herb-object b').textContent = s.order?.self ? '自有药包' : '本单药包';
    document.querySelector('.commission-slip').hidden = !s.order || s.roundEnded;
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

