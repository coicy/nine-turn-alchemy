(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const stage = $('pillStage'), pill = $('pillVisual');
  const controls = { refine: $('refineButton'), collect: $('collectButton'), load: $('newPillButton') };
  document.querySelector('.action-row').hidden = true;
  stage.insertAdjacentHTML('beforeend', `
    <div class="commission-slip"><small>客人委托 · 材料与成丹归客</small><b>首批灵丹</b><span id="slipValue">已交 0 / 300</span><div id="deliverySeals" aria-label="已交付成丹"></div></div>
    <div class="loose-herbs" aria-hidden="true"><i>叶</i><i>根</i><i>花</i></div>
    <div class="furnace-lid" aria-hidden="true"></div>
    <svg class="hand-fan" viewBox="0 0 120 160" aria-hidden="true"><path d="M58 95Q-8 65 16 20Q42 4 59 73Q58 8 85 10Q122 27 70 97Z" fill="#9bb39c" stroke="#d0cf9b" stroke-width="3"/><path d="M60 30L64 94M24 32L62 94M93 27L64 94" stroke="#426452" stroke-width="2"/><path d="M64 90L70 151" stroke="#b59155" stroke-width="9"/></svg>
    <button class="work-object herb-object" id="herbObject" type="button"><span class="pack-stack" id="packStack" aria-hidden="true"></span><svg viewBox="0 0 100 100" aria-hidden="true"><path class="paper-wrap" d="M20 31L50 18L81 31L86 78L50 91L14 78Z" fill="#a58a59" stroke="#dbc795" stroke-width="2"/><path d="M20 31L50 46L81 31M50 46V90M18 58L83 58" fill="none" stroke="#5c4932" stroke-width="4"/><path d="M48 40Q22 17 35 12Q52 13 50 40Q68 8 76 19Q78 33 50 40" fill="#659679" stroke="#adc2a1" stroke-width="2"/></svg><b>委托药包</b><small id="herbHint"></small></button>
    <button class="work-object fire-object" id="fireObject" type="button"><svg viewBox="0 0 100 100" aria-hidden="true"><path d="M13 83V56A37 37 0 0 1 87 56V83Z" fill="#101e1c" stroke="#9b8054" stroke-width="5"/><path class="hand-flame" d="M50 79C17 77 29 51 43 44Q41 61 50 56Q62 41 57 25C90 55 80 81 50 79Z" fill="#e99b50"/><path d="M49 78Q35 67 52 55Q51 67 62 66Q62 80 49 78" fill="#ffe3a0"/></svg><b id="fireLabel"></b><small id="fireHint"></small></button>
    <button class="work-object tray-object" id="trayObject" type="button" aria-label="将手中灵丹放入交付盘"><svg viewBox="0 0 120 70" aria-hidden="true"><ellipse cx="60" cy="46" rx="51" ry="17" fill="#617d72" stroke="#c3b47e" stroke-width="3"/><ellipse cx="60" cy="41" rx="51" ry="17" fill="#243f39" stroke="#97af95" stroke-width="3"/><ellipse cx="60" cy="40" rx="38" ry="10" fill="none" stroke="#698877"/></svg><span id="trayPills" aria-hidden="true"></span><b>交付盘</b><small id="trayHint">灵丹出炉后落在这里</small></button>
    <p class="work-instruction" id="workInstruction" role="status"></p>
    <div class="carried-object" id="carriedObject" hidden aria-hidden="true"></div>
  `);
  // Keep viewport-based pointer coordinates outside transformed/filtered panels.
  document.body.appendChild?.($('carriedObject'));
  stage.appendChild(document.querySelector('.risk-panel'));
  const herbs = $('herbObject'), fire = $('fireObject'), tray = $('trayObject');
  pill.tabIndex = 0; pill.setAttribute('role', 'button');
  let held = null, drag = null, locked = false, timer = null, generation = 0;
  let delivered = [], suppress = new Set();
  const snapshot = () => window.AlchemyGame.snapshot();
  const active = () => snapshot().started && !snapshot().roundEnded;
  const canLoad = () => active() && !controls.load.disabled && !locked;
  const canCollect = () => active() && !controls.collect.disabled && !locked;
  function select(kind) { held = held === kind ? null : kind; sync(); }
  function animate(name, duration, commit) {
    if (locked) return;
    locked = true; window.AlchemyInteractionBusy = true; held = null; stage.classList.add(name); sync();
    window.dispatchEvent?.(new Event('alchemy:interaction'));
    const token = generation;
    timer = setTimeout(() => {
      timer = null;
      if (token !== generation) return;
      stage.classList.remove(name); locked = false; window.AlchemyInteractionBusy = false;
      commit(); sync();
    }, duration);
  }
  function load() {
    if (!canLoad() || held !== 'herbs') return;
    animate('pouring', 720, () => { if (!controls.load.disabled) controls.load.click(); });
  }
  function collect() {
    if (!canCollect() || held === 'herbs') return;
    const before = snapshot();
    animate('landing', 320, () => {
      if (controls.collect.disabled) return;
      controls.collect.click();
      delivered.push({value:before.value, quality:before.quality, turn:before.turn, nature:before.order?.nature || 'neutral'});
      $('trayPills').innerHTML = delivered.map(d => `<i data-quality="${d.quality}" data-nature="${d.nature || 'neutral'}" title="${d.turn}转 · ${Math.round(d.value)}">丹</i>`).join('');
      $('deliverySeals').innerHTML = delivered.map(d => `<i>${Math.round(d.value)}</i>`).join('');
    });
  }
  function refine() {
    if (!active() || locked || controls.refine.disabled) return;
    held = null;
    stage.classList.remove('fanning'); void stage.offsetWidth; stage.classList.add('fanning');
    controls.refine.click();
    sync();
  }
  herbs.addEventListener('click', () => { if (!suppress.has('herbs') && canLoad()) select('herbs'); });
  fire.addEventListener('click', () => { if (held === 'herbs') load(); else if (held === 'pill') { held = null; sync(); } else refine(); });
  tray.addEventListener('click', collect);
  pill.addEventListener('click', () => { if (!suppress.has('pill') && canCollect()) select('pill'); });
  pill.addEventListener('keydown', e => {
    if (['Enter',' '].includes(e.key)) { e.preventDefault(); e.stopPropagation(); if (!e.repeat && canCollect()) select('pill'); }
  });
  // The visible furnace mouth is also an input target, including the pour destination.
  const furnace = document.querySelector('.furnace');
  furnace.classList.add('furnace-target');
  furnace.addEventListener('click', () => {
    if (held === 'herbs') load();
    else if (held === 'pill') { held = null; sync(); }
    else refine();
  });
  function inside(el, e) { const r = el.getBoundingClientRect(); return e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }
  function endDrag(e) {
    if (!drag) return;
    const {kind, moved} = drag; drag = null;
    $('carriedObject').hidden = true;
    stage.classList.remove('dragging-herbs', 'dragging-pill');
    if (moved || e.type !== 'pointerup') {
      suppress.add(kind); setTimeout(() => suppress.delete(kind), 0);
      if (moved && e.type === 'pointerup') {
        held = kind;
        if (kind === 'herbs' && (inside(furnace,e) || inside(fire,e))) load();
        else if (kind === 'pill' && inside(tray,e)) collect();
        else held = null;
      } else held = null;
    }
    sync();
  }
  for (const [object,kind] of [[herbs,'herbs'],[pill,'pill']]) {
    object.addEventListener('pointerdown', e => {
      if (drag || e.button !== 0 || (kind === 'herbs' ? !canLoad() : !canCollect())) return;
      object.setPointerCapture(e.pointerId);
      drag = {kind,id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};
    });
    object.addEventListener('pointermove', e => {
      if (!drag || drag.kind !== kind || drag.id !== e.pointerId) return;
      if (Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8) drag.moved = true;
      if (!drag.moved) return;
      const ghost = $('carriedObject'); ghost.hidden = false;
      ghost.textContent = kind === 'herbs' ? '药' : '丹'; ghost.dataset.kind = kind;
      ghost.style.left = e.clientX+'px'; ghost.style.top = e.clientY+'px';
      stage.classList.add('dragging-'+kind);
    });
    ['pointerup','pointercancel','lostpointercapture'].forEach(n => object.addEventListener(n,endDrag));
  }
  function sync() {
    const s = snapshot();
    herbs.disabled = !canLoad();
    fire.disabled = locked || !active() || (held === 'herbs' ? controls.load.disabled : controls.refine.disabled);
    tray.disabled = !canCollect() || held === 'herbs';
    pill.setAttribute('aria-disabled',String(!canCollect()));
    pill.setAttribute('aria-pressed',String(held === 'pill'));
    pill.setAttribute('aria-label','取出灵丹，再点交付盘落盘；也可拖入盘中');
    herbs.setAttribute('aria-pressed',String(held === 'herbs'));
    herbs.setAttribute('aria-label',`剩余 ${s.remaining} 包委托药材，取一包投入炉口`);
    fire.setAttribute('aria-label',held === 'herbs' ? '将整包药材投入炉口' : '挥扇催炼一次');
    stage.dataset.held = held || '';
    stage.classList.toggle('empty-furnace',s.pillEnded || !s.started);
    stage.classList.toggle('can-collect',canCollect());
    stage.classList.toggle('awaiting-herbs',canLoad());
    stage.classList.toggle('finished-order',s.roundEnded);
    stage.classList.toggle('no-herbs',s.remaining === 0);
    $('packStack').innerHTML = Array.from({length:Math.max(0,s.remaining-1)},() => '<i></i>').join('');
    $('herbHint').textContent = held === 'herbs' ? '已拆包 · 点炉口投入' : `剩余 ${s.remaining} 包 · 取药`;
    $('fireLabel').textContent = locked ? '操作中' : held === 'herbs' ? '整包投入' : !s.pillEnded && s.turn >= 9 ? '九转已成' : '挥扇催炼';
    $('fireHint').textContent = s.pillEnded ? '等待投药起炉' : '点炉膛 · 每次一炼';
    $('trayHint').textContent = held === 'pill' ? '点此落盘，交还委托' : `已交 ${delivered.length} 颗 · 点盘收丹交付`;
    const target = s.target || 300;
    $('slipValue').textContent = `已交 ${Math.round(s.delivered)} / ${target}`;
    const heading = document.querySelector('.commission-slip b');
    if (s.order && heading) heading.textContent = s.order.name;
    $('workInstruction').textContent = locked ? '药材与成丹按本炉结算，请稍候…' : !s.started ? '接下委托，取药开炉' : s.roundEnded ? (s.delivered >= target ? '委托已完成 · 成丹已归客' : '三包药材已用尽 · 本单结束') : held === 'herbs' ? '整包药材已展开 · 点炉口倾倒，Esc 放回' : held === 'pill' ? '已托起灵丹 · 点交付盘，Esc 放回炉中' : s.pillEnded ? '取一包药材，拖入炉口 · 也可点药包，再点炉口' : s.busy ? '扇落火起，丹纹正在变化…' : s.turn >= 9 ? '九转已成 · 取丹放入交付盘' : '点炉膛挥扇催炼 · 点交付盘收丹，也可拖丹入盘';
  }
  function updateCampaignContext() {
    const s = snapshot();
    if (!s.campaignEnabled) return;
    if (!s.order) {
      document.getElementById('workInstruction').textContent = '今日尚未接单 · 在上方委托簿选择一份订单';
      document.getElementById('slipValue').textContent = '等待接单';
      document.querySelector('.commission-slip b').textContent = '今日待接单';
    } else if (s.roundEnded) {
      document.getElementById('workInstruction').textContent = '本单已结清 · 请接下一单，全部订单处理完后可日结';
    }
  }
  window.addEventListener('alchemy:render', updateCampaignContext);
  function reset() {
    generation++; clearTimeout(timer); timer = null; locked = false; window.AlchemyInteractionBusy = false; held = null; drag = null;
    stage.classList.remove('pouring','landing','fanning','dragging-herbs','dragging-pill');
    $('carriedObject').hidden = true; delivered = [...(snapshot().collected || [])]; suppress.clear();
    $('trayPills').innerHTML = delivered.map(d => `<i data-quality="${d.quality}" data-nature="${d.nature || 'neutral'}">丹</i>`).join('');
    $('deliverySeals').innerHTML = delivered.map(d => `<i>${Math.round(d.value)}</i>`).join(''); sync();
    if (snapshot().order || !snapshot().campaignEnabled) herbs.focus({preventScroll:true});
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { held = null; if (drag) endDrag({type:'pointercancel'}); sync(); return; }
    if (!['Enter',' '].includes(e.key) || !active()) return;
    if (e.target.closest('button,input,a,summary,[role="button"]')) return;
    e.preventDefault(); e.stopImmediatePropagation();
    if (!e.repeat) { if (held === 'herbs') load(); else if (held === 'pill') collect(); else refine(); }
  }, true);
  window.addEventListener('alchemy:render', sync);
  window.addEventListener('alchemy:order', reset);
  $('startButton').addEventListener('click',reset);
  $('restartButton').addEventListener('click',reset);
  function cancelCarry() { held = null; if (drag) endDrag({type:'pointercancel'}); sync(); }
  window.addEventListener('blur',cancelCarry);
  document.addEventListener('visibilitychange',() => {if(document.hidden)cancelCarry();});
  sync();
})();




