/* Transient painted effects share the scene coordinates and use no gameplay randomness. */
(() => {
  'use strict';
  const stage = document.getElementById('pillStage');
  const canvas = document.createElement('canvas');
  canvas.id = 'refineAnimation';
  canvas.setAttribute('aria-hidden', 'true');
  stage.append(canvas);
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const durations = {load:620, fan:560, success:760, big:1100, hold:600, damage:800, explode:1250, shield:900, fusion:1150, complete:1400, collect:720};
  let phase = null;
  let raf = 0;
  let serial = 0;
  let frames = 0;

  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
    phase = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function fit() {
    const main = document.getElementById('alchemyScene');
    if (!main) return;
    if (canvas.width !== main.width || canvas.height !== main.height) {
      stop();
      canvas.width = main.width;
      canvas.height = main.height;
    }
  }

  function start(kind) {
    stop();
    fit();
    if (reduced.matches || AlchemyViewState.snapshot().current !== 'work') return;
    phase = {kind, start:performance.now(), duration:durations[kind]};
    serial++;
    raf = requestAnimationFrame(draw);
  }

  function scatter(index) {
    const value = Math.sin(index * 127.1 + 31.7) * 43758.5453;
    return value - Math.floor(value);
  }

  function wash(x, y, rx, ry, color, alpha) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(rx, ry);
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function flecks(x, y, radius, progress, count, color, falling = false) {
    ctx.fillStyle = color;
    for (let i = 0; i < count; i++) {
      const angle = scatter(i + 1) * Math.PI * 2;
      const distance = radius * (.3 + scatter(i + 40)) * (1 - (1-progress)**3);
      const px = x + Math.cos(angle) * distance;
      const py = y + Math.sin(angle) * distance * .45 + (falling ? progress*progress*radius : -progress*radius*.65);
      const size = Math.max(.8, radius * (.009 + scatter(i + 80)*.015));
      ctx.globalAlpha = Math.sin(Math.PI * progress) * (.35 + scatter(i + 100)*.5);
      ctx.beginPath();
      ctx.ellipse(px, py, size, size*.6, angle, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function wisps(x, y, radius, progress, color, count) {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (let i = 0; i < count; i++) {
      const side = (i - (count-1)/2) * radius*.3;
      const rise = (.25 + progress)*radius*(1 + i*.15);
      ctx.globalAlpha = Math.sin(Math.PI*progress)*.5;
      ctx.lineWidth = Math.max(1, radius*.025*(1-progress));
      ctx.beginPath();
      ctx.moveTo(x+side, y-rise*.15);
      ctx.bezierCurveTo(x+side-radius*.12, y-rise*.4, x+side+radius*.2, y-rise*.65, x+side+radius*.06, y-rise);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  function fire(progress, layout) {
    const f = layout.firebox;
    const x = f.x+f.w*.5;
    const y = f.y+f.h*.64;
    const strength = Math.sin(Math.PI*progress);
    ctx.save();
    // Light stays inside the opening and leaves the painted stove intact.
    ctx.beginPath();
    ctx.ellipse(x, y, f.w*.38, f.h*.42, 0, 0, Math.PI*2);
    ctx.clip();
    wash(x,y,f.w*.7,f.h*.7,'#efa953',strength*.45);
    for (let i=0;i<4;i++) {
      const dx = f.w*(i-1.5)*.12;
      const height = f.h*(.25+.2*scatter(i+6))*strength;
      ctx.fillStyle = i%2 ? '#e7ad68' : '#f5d394';
      ctx.globalAlpha = strength*.4;
      ctx.beginPath();
      ctx.moveTo(x+dx-f.w*.06,y+f.h*.15);
      ctx.quadraticCurveTo(x+dx-f.w*.1,y-height*.4,x+dx+Math.sin(progress*7+i)*f.w*.06,y-height);
      ctx.quadraticCurveTo(x+dx+f.w*.12,y,x+dx+f.w*.06,y+f.h*.15);
      ctx.fill();
    }
    ctx.restore();
    wisps(x+f.w*.65,y,f.w*.5,progress,'#d4ccb5',3);
  }

  function draw(now) {
    if (!phase) return;
    if (document.hidden) { stop(); return; }
    frames++;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const progress = Math.min(1,(now-phase.start)/phase.duration);
    const fade = Math.sin(Math.PI*progress);
    const layout = AlchemyWorldLayout;
    const mouth = layout.mouth;
    const pill = layout.objects.pill;
    const x = pill.x+pill.w/2;
    const y = pill.y+pill.h/2;
    const radius = Math.max(pill.w*.7,mouth.w*.15);
    const kind = phase.kind;
    ctx.save();
    if (kind === 'fan') {
      fire(progress,layout);
    } else if (kind === 'explode' || kind === 'damage') {
      const power = kind === 'explode' ? 1.8 : 1;
      const smokeY = kind === 'explode' ? mouth.y+mouth.h*.75 : y;
      for (let i=0;i<7;i++) {
        const drift = (scatter(i+160)-.5)*radius*power;
        const rise = progress*radius*(.6+scatter(i+180));
        const size = radius*(.2+progress*.4);
        wash(x+drift,smokeY-rise,size,size*.75,'#796c5a',fade*.18);
      }
      wisps(x,smokeY,radius*power,progress,'#918675',kind==='explode'?4:2);
      flecks(x,smokeY,radius*power,progress,kind==='explode'?28:10,'#ac7551',true);
    } else if (kind === 'hold') {
      wisps(x,y,radius*.6,progress,'#c7c2ac',2);
    } else if (kind === 'collect') {
      wisps(x,y,radius,progress,'#d7c29b',3);
      flecks(x,y,radius*.6,progress,9,'#c39350');
    } else {
      const major = ['big','fusion','complete'].includes(kind);
      const color = kind === 'shield' ? '#c8d3b0' : '#e7bc78';
      wash(x,y,radius*(major?1.5:1),radius*.65,color,fade*(major?.26:.16));
      wisps(x,y,radius*(major?1.4:.8),progress,'#d7c29b',major?5:3);
      flecks(x,y,radius*(major?1.8:1),progress,major?24:10,'#c99c59');
      if (kind==='shield' || kind==='fusion' || kind==='complete') {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1,radius*.025);
        ctx.globalAlpha = fade*.6;
        for(let i=0;i<2;i++) {
          ctx.beginPath();
          ctx.ellipse(x,y,radius*(.75+progress*.4),radius*.32, i*.3,progress*2+i*Math.PI,progress*2+i*Math.PI+Math.PI*.8);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
    if (progress<1) raf=requestAnimationFrame(draw);
    else stop();
  }

  window.addEventListener('alchemy:fanning',()=>start('fan'));
  window.addEventListener('alchemy:feedback',event=>{
    const kind=event.detail.event;
    if (kind==='start') {
      if (!AlchemyGame.snapshot().pillEnded) start('load');
    } else if (durations[kind]) start(kind);
    else stop();
  });
  for (const name of ['alchemy:order','alchemy:view-ready','blur']) window.addEventListener(name,stop);
  window.addEventListener('alchemy:world-layout',fit);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  reduced.addEventListener('change',()=>{if(reduced.matches)stop();});
  fit();
  window.AlchemyRefineAnimation={get phase(){return phase?.kind||null;},get frames(){return frames;},get serial(){return serial;}};
})();
