// Trace a furnace talisman in paper coordinates so the same ink can be affixed and restored.
(() => {
  'use strict';
  const paper = document.getElementById('ritualGrid');
  const svg = paper.querySelector('svg');
  const guides = Array.from(svg.querySelectorAll('.rite-guides path'));
  const inkPaths = svg.querySelectorAll('.rite-ink path');
  const nib = svg.querySelector('.rite-tip');
  const lead = svg.querySelector('.rite-lead');
  const names = ['起云头', '行火令', '收符脚'];
  const samples = guides.map(path => {
    const length = path.getTotalLength();
    const count = Math.ceil(length / 1.8);
    return Array.from({length:count+1}, (_, i) => {
      const p = path.getPointAtLength(length*i/count);
      return [p.x, p.y];
    });
  });
  let pill, save, finish, pointer = null, keyTimer = 0, waitingForLift = false;
  const distance = (a,b) => Math.hypot(a[0]-b[0],a[1]-b[1]);
  const round = n => Math.round(n*10)/10;

  function lift() {
    pointer = null;
    clearInterval(keyTimer);
    keyTimer = 0;
    waitingForLift = false;
    if (pill?.ritualActive) {paint();save();}
  }

  // Render the two edges of a brush mark. Turns broaden and both ends taper.
  function ribbon(points) {
    if (!points.length) return '';
    const left = [], right = [];
    points.forEach(([x,y], i) => {
      const prev = points[Math.max(0,i-1)], next = points[Math.min(i+1,points.length-1)];
      const dx = next[0]-prev[0], dy = next[1]-prev[1], norm = Math.hypot(dx,dy) || 1;
      const edge = Math.min(1,(i+1)/4,(points.length-i)/4);
      const width = (.95 + 1.55*Math.abs((dy+.45*dx)/norm))*edge;
      const nx = -dy/norm*width, ny = dx/norm*width;
      left.push([round(x+nx),round(y+ny)]);
      right.push([round(x-nx),round(y-ny)]);
    });
    return 'M'+left.concat(right.reverse()).map(p=>p.join(' ')).join('L')+'Z';
  }

  function paint() {
    pill.ritualInk.lines.forEach((line,i) => inkPaths[i].setAttribute('d',ribbon(line)));
    const step = pill.ritualStep;
    guides.forEach((g,i) => g.classList.toggle('current',i===step));
    if (step >= guides.length) return;
    const cursor=pill.ritualInk.cursor;
    const section=waitingForLift ? [] : samples[step].slice(cursor,cursor+9);
    lead.setAttribute('d',section.length ? 'M'+section.map(point=>point.join(' ')).join('L') : '');
    const [x,y]=samples[step][cursor];
    nib.setAttribute('visibility',waitingForLift?'hidden':'visible');
    nib.setAttribute('transform',`translate(${x} ${y})`);
    const drawing=pointer!==null || keyTimer;
    nib.classList.toggle('is-ready',!drawing&&!waitingForLift);
    const instruction=waitingForLift ? '抬手换下一笔。' : drawing ? '沿亮线运笔。' :
      cursor ? '按住金点，接着描（第'+(step+1)+'/'+guides.length+'笔）。' : '按住金点沿亮线描，分三笔写完。';
    window.AlchemyFeedback?.setRitualGuide(pill.ritualActive ? names[step]+'（'+(step+1)+'/'+guides.length+'）· '+instruction : '');
  }

  function prepare(p, sealed) {
    pill = p;
    if (p.ritualInk) return;
    // Older saves tracked nine palaces. Map that progress onto the three strokes once.
    const units = sealed ? 9 : Math.min(8,Math.max(0,Math.trunc(p.ritualStep)||0));
    const step = Math.floor(units/3);
    const cursor = step===3 ? 0 : Math.floor((units%3)/3*(samples[step].length-1));
    p.ritualInk = {cursor,lines:samples.map((line,i) =>
      i<step ? line.slice() : i===step && cursor ? line.slice(0,cursor+1) : [])};
    p.ritualStep = step;
  }

  function endStroke() {
    const finishedStep = pill.ritualStep;
    pill.ritualStep++;
    pill.ritualInk.cursor = 0;
    waitingForLift = pointer!==null || !!keyTimer;
    clearInterval(keyTimer);
    keyTimer = 0;
    window.AlchemyGameFeel?.emit('stroke', {step:finishedStep+1, total:guides.length, tier:'small'});
    if (pill.ritualStep === guides.length) {
      pointer=null;waitingForLift=false;paint();finish();
    } else {
      paint();save();
    }
  }

  function put(point) {
    const step = pill.ritualStep, guide = samples[step], ink = pill.ritualInk;
    const from = ink.cursor;
    let best = from, error = distance(point,guide[from]);
    // Only inspect the next stretch: crossing the body of the glyph cannot skip a loop.
    const limit = Math.min(guide.length-1,from+7);
    for (let i=from+1;i<=limit;i++) {
      const d=distance(point,guide[i]);
      if (d < error) { error=d; best=i; }
    }
    if (error>8) return;
    // Reaching the last sample slightly outside the finish radius must remain recoverable.
    // Returning to the nib can finish the stroke even when the cursor cannot advance.
    const atEnd=best>=guide.length-2 && distance(point,guide[guide.length-1])<5;
    if (best===from && !atEnd) return;
    ink.cursor = best;
    ink.lines[step].push(point.map(round));
    if (atEnd) endStroke();
  }

  function location(e) {
    const point = new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    return [point.x,point.y];
  }

  paper.addEventListener('pointerdown', e => {
    if (!pill?.ritualActive || pointer!==null || keyTimer || !e.isPrimary || e.button!==0) return;
    const ink=pill.ritualInk, step=pill.ritualStep, point=location(e);
    if (distance(point,samples[step][ink.cursor])>11) return;
    e.preventDefault();
    pointer=e.pointerId;
    paper.setPointerCapture(pointer);
    if (!ink.lines[step].length) ink.lines[step].push(point.map(round));
    paint();
  });

  function trace(e) {
    if (pointer!==e.pointerId || !pill?.ritualActive || waitingForLift) return;
    const step=pill.ritualStep, ink=pill.ritualInk;
    const events=e.getCoalescedEvents?.() || [];
    for (const event of events.length ? events : [e]) {
      const point=location(event), last=ink.lines[step][ink.lines[step].length-1];
      const span=distance(last,point);
      if (span>85) continue;
      const parts=Math.ceil(span/2.5);
      for (let i=1;i<=parts && pointer!==null && !waitingForLift;i++) {
        put([last[0]+(point[0]-last[0])*i/parts,last[1]+(point[1]-last[1])*i/parts]);
      }
      if (pointer===null || waitingForLift) break;
    }
    if (pointer!==null) paint();
  }
  paper.addEventListener('pointermove',trace);
  // A pen or finger may report its final position only on release.
  paper.addEventListener('pointerup',e=>{if(e.pointerId===pointer){trace(e);if(e.pointerId===pointer)lift();}});
  for (const type of ['pointercancel','lostpointercapture']) {
    paper.addEventListener(type,e=>{if(e.pointerId===pointer) lift();});
  }
  paper.addEventListener('keydown',e=>{
    if (e.key!==' ' && e.key!=='Enter') return;
    e.preventDefault();
    if(e.repeat || keyTimer || waitingForLift || pointer!==null || !pill?.ritualActive) return;
    const guide=samples[pill.ritualStep], ink=pill.ritualInk;
    if (!ink.lines[pill.ritualStep].length) ink.lines[pill.ritualStep].push(guide[0]);
    keyTimer=setInterval(()=>{
      put(guide[Math.min(guide.length-1,ink.cursor+2)]);
      if(keyTimer) paint();
    },32);
  });
  paper.addEventListener('keyup',e=>{if((keyTimer || waitingForLift) && (e.key===' ' || e.key==='Enter')) lift();});
  paper.addEventListener('blur',()=>{if(keyTimer || (waitingForLift && pointer===null)) lift();});
  window.addEventListener('blur',()=>{if(pointer!==null || keyTimer || waitingForLift) lift();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden && (pointer!==null || keyTimer || waitingForLift)) lift();});
  window.addEventListener('pagehide',()=>{if(pointer!==null || keyTimer) lift();});
  window.AlchemyRitualBrush = {
    begin(p,persist,onFinish) {
      pointer=null;clearInterval(keyTimer);keyTimer=0;waitingForLift=false;
      save=persist;finish=onFinish;
      window.AlchemyGameFeel?.emit('ritual-start', {resume:!!p.ritualInk, tier:'large'});
      prepare(p,false);
      paper.disabled=false;
      paint();
      paper.focus({preventScroll:true});
    },
    seal(p) {
      prepare(p,true);
      paper.disabled=true;
      window.AlchemyFeedback?.setRitualGuide('');
      window.AlchemyGameFeel?.emit('ritual-sealed', {tier:'large'});
      paint();
    }
  };
})();
