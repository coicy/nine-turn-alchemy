/* One business furnace, two working views. Visual state never owns inventory or rewards. */
(() => {
  'use strict';
  const game = window.AlchemyGame;
  const route = window.AlchemyViewState;
  const layout = window.AlchemyWorldLayout;
  const stage = document.getElementById('pillStage');
  const viewport = document.querySelector('.engine-viewport');
  const forge = document.querySelector('.forge-panel');
  const nav = document.querySelector('.engine-nav');
  const root = 'assets/furnace-view-v102/';
  const controls = document.createElement('div');
  controls.className = 'furnace-controls';
  controls.innerHTML = '<img class="furnace-cover" alt="" draggable="false"><button class="furnace-pill" aria-label="拿起炉内丹药，放到收丹盘" data-focus-key="furnace-pill"></button><button class="furnace-fire" data-focus-key="furnace-fire">催炼</button><button class="furnace-tray" data-focus-key="furnace-tray">收丹盘</button><button class="furnace-resume" data-focus-key="furnace-resume">回到本炉</button><button class="furnace-skip" hidden>返回丹房</button>';
  stage.append(controls);
  const pill = controls.querySelector('.furnace-pill');
  const fire = controls.querySelector('.furnace-fire');
  const tray = controls.querySelector('.furnace-tray');
  const resume = controls.querySelector('.furnace-resume');
  const lid = controls.querySelector('.furnace-cover');
  const skip = controls.querySelector('.furnace-skip');
  const heading = document.createElement('div');
  heading.className = 'furnace-heading';
  heading.innerHTML = '<button class="furnace-back" data-focus-key="furnace-back">‹ 丹房</button><strong>炉前</strong><div class="furnace-facts"><b></b><span></span><small></small></div><button class="furnace-inspect" data-focus-key="furnace-inspect">看丹</button><button class="furnace-manual" data-focus-key="furnace-manual">炉谱</button>';
  nav.prepend(heading);
  let lastLiveKey = '';
  let endingTimer = null;
  let endingKey = '';
  let fanning = false;
  let drag = null;
  let geometryKey = '';
  let viewportKey = '';
  let fitting = false;

  const live = s => s.started && !s.pillEnded && !s.roundEnded;
  const active = () => route.snapshot().workMode === 'furnace';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rect = (element, r) => {
    for (const name of ['x', 'y', 'w', 'h']) {
      element.style.setProperty({x:'left',y:'top',w:'width',h:'height'}[name], r[name] + 'px', 'important');
    }
  };
  function returnToRoom() {
    clearTimeout(endingTimer);
    endingTimer = null;
    route.navigate('work', {workMode:'room', internal:true});
    requestAnimationFrame(() => {
      const receipt = document.querySelector('#roomSettlement [data-primary]');
      const material = [...document.querySelectorAll('.herb-slot:not([aria-disabled="true"])')].find(el => el.checkVisibility());
      const target = live(game.snapshot()) ? resume
        : receipt?.checkVisibility() ? receipt
          : material || document.querySelector('.world-location-toggle');
      target?.focus({preventScroll:true});
    });
  }
  heading.querySelector('.furnace-back').onclick = () => route.navigate('work', {workMode:'room'});
  heading.querySelector('.furnace-inspect').onclick = () => route.navigate('pill', {anchor:heading.querySelector('.furnace-inspect')});
  heading.querySelector('.furnace-manual').onclick = () => route.navigate('manual', {chapter:'runes', anchor:heading.querySelector('.furnace-manual')});
  resume.onclick = () => {
    if (route.navigate('work', {workMode:'furnace'})) requestAnimationFrame(() => pill.focus({preventScroll:true}));
  };
  skip.onclick = returnToRoom;
  fire.onclick = () => window.AlchemyScene2D.refine();
  tray.onclick = () => window.AlchemyScene2D.collectHeld();
  function center(element) {
    const r = element.getBoundingClientRect();
    return {clientX:r.x + r.width / 2, clientY:r.y + r.height / 2};
  }
  pill.addEventListener('pointerdown', e => {
    if (e.button !== 0 || !window.AlchemyScene2D.takePill(e)) return;
    e.preventDefault();
    pill.setPointerCapture(e.pointerId);
    drag = {x:e.clientX, y:e.clientY, moved:false};
  });
  pill.addEventListener('pointermove', e => {
    if (!drag) return;
    drag.moved ||= Math.hypot(e.clientX-drag.x, e.clientY-drag.y) > 8;
    window.AlchemyScene2D.movePill(e);
  });
  pill.addEventListener('pointerup', e => {
    if (!drag) return;
    const moved = drag.moved;
    drag = null;
    if (moved) window.AlchemyScene2D.dropPill(e);
    else tray.focus({preventScroll:true});
  });
  pill.addEventListener('pointercancel', () => {drag = null; window.AlchemyScene2D.cancel();});
  pill.addEventListener('lostpointercapture', () => {if (drag) {drag = null;window.AlchemyScene2D.cancel();}});
  pill.addEventListener('click', e => {
    if (e.detail === 0 && window.AlchemyScene2D.takePill(center(pill))) tray.focus({preventScroll:true});
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && active() && window.AlchemyScene2D.held) {
      e.preventDefault();
      window.AlchemyScene2D.cancel();
      pill.focus({preventScroll:true});
    }
  }, true);

  function fit() {
    if (fitting) return true;
    fitting = true;
    try {
      const mobile = innerWidth <= 650;
      const w = viewport.clientWidth;
      const h = viewport.clientHeight;
      const currentViewport = w + ':' + h;
      if (window.AlchemyScene2D?.held && viewportKey === currentViewport) return true;
      viewportKey = currentViewport;
      const heightOf = selector => {
        const el = document.querySelector(selector);
        return el && !el.hidden && el.checkVisibility() ? el.getBoundingClientRect().height : 0;
      };
      const view = route.snapshot();
      let reserve = mobile ? Math.max(heightOf('#refineOdds'), heightOf('.refine-odds-toggle'), heightOf('#roomChoices')) + 12 : 0;
      if (mobile && view.reading && view.short) {
        reserve = Math.max(reserve, heightOf(view.current === 'pill' ? '.pill-detail-panel' : '.equipment-drawer') + 12);
      }
      const width = mobile ? w : 1600;
      const height = mobile ? Math.max(180, h-reserve) : 900;
      const scale = mobile ? 1 : Math.min(w/width, h/height, 1.6);
      const imageHeight = mobile ? Math.min(width*1.5, height/.77) : height;
      const imageWidth = mobile ? imageHeight/1.5 : width;
      const left = (width-imageWidth)/2;
      const pointRect = (x,y,rw,rh) => ({x:left+x*imageWidth,y:y*imageHeight,w:rw*imageWidth,h:rh*imageHeight});
      const key = [width,height,imageWidth,reserve,scale].join(':');
      if (window.AlchemyScene2D?.held && key !== geometryKey) window.AlchemyScene2D.cancel();
      document.body.classList.toggle('world-mobile', mobile);
      document.body.classList.toggle('compact-forge', !mobile && w<1280);
      viewport.style.setProperty('--work-top', '0px');
      Object.assign(layout.objects.pill, mobile ? pointRect(.275,.28,.19,.1267) : pointRect(.342,.245,.105,.1867));
      // Visible body and hit target share an anchor, but use independent screen sizes.
      const p = layout.objects.pill;
      const visualDiameter = mobile ? 44 : 88/scale;
      const size = Math.max(48/scale, visualDiameter);
      p.x += (p.w-size)/2; p.y += (p.h-size)/2; p.w = p.h = size;
      p.visualDiameter = visualDiameter;
      Object.assign(layout.firebox, mobile ? pointRect(.22,.60,.27,.15) : pointRect(.30,.73,.18,.19));
      Object.assign(layout.objects.tray, mobile ? pointRect(.715,.414,.26,.156) : pointRect(.68,.355,.225,.278));
      Object.assign(layout.objects.tool, mobile ? pointRect(.51,.548,.12,.14) : pointRect(.478,.57,.105,.28));
      Object.assign(layout.mouth, mobile ? pointRect(.055,.116,.60,.34) : pointRect(.21,.055,.36,.42));
      layout.cutaway.source = null;
      Object.assign(layout.toolRest, mobile ? pointRect(.71,.278,.28,.048) : pointRect(.70,.08,.27,.105));
      for (const element of [stage, forge]) {
        element.style.setProperty('--world-width', width+'px');
        element.style.setProperty('--world-height', height+'px');
        element.style.setProperty('--room-base-width', imageWidth+'px');
        element.style.setProperty('--room-base-height', imageHeight+'px');
        element.style.setProperty('--room-camera-left', left+'px');
      }
      stage.style.setProperty('--scene-scale', String(scale));
      stage.style.setProperty('--furnace-image', 'url("'+root+(mobile?'mobile-v2':'desktop')+'.webp")');
      forge.style.left = mobile ? '0' : '50%';
      forge.style.top = mobile ? '0' : '50%';
      forge.style.transform = mobile ? 'none' : 'translate(-50%,-50%) scale('+scale+')';
      const canvas = document.getElementById('alchemyScene');
      if (canvas.width !== Math.round(width)) canvas.width = Math.round(width);
      if (canvas.height !== Math.round(height)) canvas.height = Math.round(height);
      rect(pill, p); rect(fire, layout.firebox); rect(tray, layout.objects.tray);
      rect(document.getElementById('fireResponse'), layout.firebox);
      const closed = fanning || game.snapshot().busy;
      lid.src = root+(closed?'lid-closed':'lid-standing')+'.webp';
      rect(lid, closed ? (mobile?pointRect(.045,.114,.63,.34):pointRect(.205,.04,.37,.425)) : (mobile?pointRect(.006,.435,.12,.24):pointRect(.025,.11,.145,.51)));
      const row = document.querySelector('.world-tool-row');
      rect(row, layout.toolRest);
      row.style.setProperty('--tool-size', (mobile?Math.max(44,imageWidth*.09):imageWidth*.072)+'px');
      layout.toolRest.slots = mobile ? [[.765,.31],[.916,.31],[.84,.36]].map(([x,y]) => {
        const center = pointRect(x,y,0,0);
        return {x:Math.min(width-48,center.x-22),y:center.y-44,w:44,h:44};
      }) : null;
      [...row.children].forEach((tool, index) => {
        tool.style.setProperty('position', mobile?'absolute':'relative', 'important');
        if (mobile) {
          const slot = layout.toolRest.slots[index];
          rect(tool, {...slot,x:slot.x-layout.toolRest.x,y:slot.y-layout.toolRest.y});
        } else {
          for (const name of ['left','top','width','height']) tool.style.removeProperty(name);
        }
      });
      document.body.style.setProperty('--work-reserve', reserve+'px');
      if (geometryKey !== key) {
        geometryKey = key;
        window.dispatchEvent(new Event('alchemy:world-layout'));
      }
      return true;
    } finally {
      fitting = false;
    }
  }

  function update() {
    const s = game.snapshot();
    const v = route.snapshot();
    const key = s.orderId + ':' + s.attempt;
    if (live(s)) {
      clearTimeout(endingTimer); endingTimer = null; endingKey = '';
      if (!window.AlchemyOpening?.active && lastLiveKey !== key) {
        lastLiveKey = key;
        route.navigate('work', {workMode:'furnace', internal:true});
        requestAnimationFrame(() => {if (!game.snapshot().runeChoices.length) pill.focus({preventScroll:true});});
        return;
      }
    } else if (active() && s.started && !window.AlchemyOpening?.active && endingKey !== key) {
      endingKey = key;
      skip.hidden = false;
      endingTimer = setTimeout(returnToRoom, reduced()?0:650);
    }
    const near = active();
    const held = !!window.AlchemyScene2D?.held;
    const choosing = !!s.runeChoices?.length;
    const blocked = s.busy || fanning || choosing || !live(s);
    if (s.busy || fanning || choosing) {
      const instruction = document.getElementById('workInstruction');
      instruction.hidden = true;
      instruction.textContent = '';
    }
    controls.dataset.held = held ? 'true' : 'false';
    pill.disabled = blocked;
    pill.setAttribute('aria-disabled', String(blocked || held));
    fire.disabled = blocked || held || s.turn >= 100;
    tray.disabled = !held || blocked;
    heading.querySelector('.furnace-back').disabled = blocked || held;
    heading.querySelector('.furnace-inspect').disabled = s.busy || fanning || held || !live(s);
    heading.querySelector('.furnace-manual').disabled = s.busy || fanning || held || !live(s);
    resume.hidden = near || !live(s) || v.location !== 'work';
    if (!near) {
      rect(resume, layout.mouth);
      skip.hidden = true;
    }
    const campaign = game.campaign();
    heading.querySelector('b').textContent = s.turn+'转 · 丹值 '+Math.round(s.value);
    heading.querySelector('.furnace-facts span').textContent = s.order?.self
      ? '收丹入匣 · 售价估计 '+window.AlchemyEconomy.saleValue(campaign,s)+' 铜钱'
      : '收丹可交 '+Math.round(s.delivered+s.value)+' / '+s.target;
    heading.querySelector('.furnace-facts small').textContent = s.order?.self
      ? '自有药材' : '已交 '+Math.round(s.delivered)+' · 余客料 '+s.remaining+' 包';
    controls.dataset.closed = fanning || s.busy ? 'true' : 'false';
    if (near) fit();
  }

  window.AlchemyFurnaceView = {fit, get ending(){return !!endingTimer;}};
  window.addEventListener('alchemy:render', () => {fanning = !!window.AlchemyScene2D?.busy; update();});
  window.addEventListener('alchemy:fanning', () => {fanning = true; update();});
  window.addEventListener('alchemy:carry', update);
  window.addEventListener('alchemy:view-ready', update);
  window.addEventListener('alchemy:opening-finished', () => {lastLiveKey='';update();});
  window.addEventListener('alchemy:order', () => {
    clearTimeout(endingTimer); endingTimer = null; endingKey = ''; lastLiveKey = '';
    if (!live(game.snapshot())) route.navigate('work', {workMode:'room', internal:true});
  });
  window.addEventListener('alchemy:world-layout', () => {
    if (!active()) rect(resume, layout.mouth);
  });
  update();
})();
