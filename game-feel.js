/* Presentation only: deterministic impulses never consume the alchemy random stream. */
(() => {
  'use strict';
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const presets = Object.freeze({
    success: {duration:340, amount:.065, lift:.025},
    big: {duration:510, amount:.13, lift:.065},
    complete: {duration:600, amount:.15, lift:.08},
    damage: {duration:380, amount:-.09, lift:0}
  });
  let quiet = false, impulse = null, flight = null, landing = null;
  try { quiet = localStorage.getItem('alchemy.reducedFeedback') === 'on'; } catch {}
  const reduced = () => quiet || media.matches;
  const controls = [];
  function clear() {
    impulse = null;
    flight?.getAnimations().forEach(a => a.cancel());
    flight?.remove(); flight = null;
    landing?.cancel(); landing = null;
    window.dispatchEvent(new Event('alchemy:pill-surface'));
  }
  function sync() {
    document.body.classList.toggle('reduced-feedback', reduced());
    for (const b of controls) {
      b.textContent = reduced() ? '动态反馈：轻简' : '动态反馈：完整';
      b.setAttribute('aria-pressed', String(reduced()));
      b.disabled = media.matches;
      b.title = media.matches ? '已跟随系统减少动态效果' : '减少丹体弹动、飞入丹匣与粒子效果';
    }
  }
  for (const selector of ['#worldSettings', '#mainMenuSettingsPanel .main-menu-v157__settings-actions']) {
    const host = document.querySelector(selector);
    if (!host) continue;
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'game-feel-setting';
    b.onclick = () => {
      quiet = !quiet;
      try { localStorage.setItem('alchemy.reducedFeedback', quiet ? 'on' : 'off'); } catch {}
      clear(); sync();
    };
    controls.push(b); host.append(b);
  }
  media.addEventListener('change', () => { clear(); sync(); });
  document.addEventListener('click', e => {
    if (e.target.closest('#mainMenuSettings,.world-settings-toggle')) sync();
  }, true);
  sync();
  function collect(id) {
    clear();
    const route = window.AlchemyViewState.snapshot();
    if (reduced() || route.current !== 'work' || route.workMode !== 'furnace') return;
    const canvas = document.querySelector('#alchemyScene');
    const target = document.querySelector('.scene-pill-stock [data-stock-pill="'+CSS.escape(String(id))+'"]');
    if (!target?.checkVisibility() || !canvas?.checkVisibility()) return;
    const r = canvas.getBoundingClientRect(), dest = target.getBoundingClientRect();
    const p = window.AlchemyWorldLayout.objects.pill;
    const size = (p.visualDiameter || p.w) * r.width / canvas.width;
    const x = r.left + (p.x+p.w/2)*r.width/canvas.width-size/2;
    const y = r.top + (p.y+p.h/2)*r.height/canvas.height-size/2;
    const dx = dest.left + dest.width/2 - size/2 - x;
    const dy = dest.top + dest.height/2 - size/2 - y;
    const im = document.createElement('img');
    im.src = window.AlchemyPillArt.image(window.AlchemyGame.snapshot());
    im.alt = ''; im.setAttribute('aria-hidden','true'); im.className = 'pill-collection-flight';
    Object.assign(im.style, {left:x+'px', top:y+'px', width:size+'px', height:size+'px'});
    document.body.append(im); flight = im;
    const a = im.animate([
      {transform:'translate(0,0) scale(1)', opacity:1},
      {transform:`translate(${dx*.35}px,${dy*.25-24}px) scale(1.06)`, opacity:1, offset:.38},
      {transform:`translate(${dx}px,${dy}px) scale(.3)`, opacity:.8, offset:.9},
      {transform:`translate(${dx}px,${dy}px) scale(.2)`, opacity:0}
    ], {duration:560, easing:'cubic-bezier(.2,.7,.25,1)'});
    a.onfinish = () => {
      im.remove(); if (flight !== im) return; flight = null;
      landing = target.animate([{boxShadow:'inset 0 0 0 2px #bc965b'}, {boxShadow:'inset 0 0 0 0 transparent'}], {duration:260,easing:'ease-out'});
    };
  }
  window.addEventListener('alchemy:feedback', e => {
    const kind = e.detail.event;
    if (kind === 'collect') { clear(); return; }
    const preset = presets[kind];
    impulse = !reduced() && preset ? {...preset, start:performance.now(), kind} : null;
    window.dispatchEvent(new Event('alchemy:pill-surface'));
  });
  // Inventory is painted after the feedback event. Wait for that real storage hook.
  window.addEventListener('alchemy:pill-stored', e => requestAnimationFrame(() => collect(e.detail.id)));
  for (const event of ['alchemy:view-ready','alchemy:order','blur']) window.addEventListener(event, clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  window.AlchemyGameFeel = {
    get reduced() { return reduced(); },
    get active() { return impulse ? impulse.kind : null; },
    sample(now = performance.now()) {
      if (!impulse || reduced()) return null;
      const t = Math.max(0, (now-impulse.start)/impulse.duration);
      if (t >= 1) { impulse = null; return null; }
      // Damped recoil, volume-preserving scale; only the painted pill is moved.
      const wave = Math.cos(t*Math.PI*3)*(1-t)**3;
      const sx = 1 + impulse.amount*wave;
      return {sx, sy:1/sx, lift:-Math.sin(Math.PI*t)*(1-t)*impulse.lift};
    }
  };
})();
