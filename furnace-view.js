/* === Consolidated source: workbench.js === */
/* Painted objects and transparent controls share the same camera and anchors. */
(()=>{'use strict';const stage=document.getElementById('pillStage'),books=stage.querySelector('.world-books'),bag=stage.querySelector('.world-casket'),row=stage.querySelector('.world-tool-row'),L=window.AlchemyWorldLayout;
const stack=document.createElement('button');stack.className='world-book-stack';stack.setAttribute('aria-label','打开案上书册');stack.textContent='书册';stage.append(stack);
const pick=document.createElement('div');pick.className='world-book-picker';pick.hidden=true;pick.innerHTML='<button data-book="record">经营簿</button><button data-book="manual">炉谱</button>';stage.append(pick);
stack.onclick=()=>{pick.hidden=!pick.hidden;if(!pick.hidden)pick.querySelector('button').focus({preventScroll:true});};pick.onclick=e=>{const b=e.target.closest('[data-book]');if(b){pick.hidden=true;AlchemyViewState.navigate(b.dataset.book,{anchor:stack});}};
document.addEventListener('pointerdown',e=>{if(!pick.contains(e.target)&&!stack.contains(e.target))pick.hidden=true;});document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pick.hidden){e.preventDefault();e.stopImmediatePropagation();pick.hidden=true;stack.focus({preventScroll:true});}},true);
function rect(el,x,y,w,h){for(const [k,v]of Object.entries({left:x,top:y,width:w,height:h}))el.style.setProperty(k,v+'px','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');}
function fit(){if(window.AlchemyViewState?.snapshot().workMode==='furnace')return;const mobile=L.mobile,w=parseFloat(stage.style.getPropertyValue('--world-width')),h=mobile?w*1448/1086:900;if(!w)return;
 if(mobile){Object.assign(L.toolRest,{x:w*.657-22,y:h*.54-48,w:w*.254+44,h:53,baseline:h*.54});rect(stack,w*.647-22,h*.594-22,44,44);rect(bag,w*.783-22,h*.594-22,44,44);rect(pick,Math.min(w-152,w*.647-44),h*.594+22,144,52);rect(row,w*.657-22,h*.54-48,w*.254+44,53);}
 else{rect(books,940,530,200,80);rect(bag,1175,512,165,96);rect(row,993,423,461,90);}
}
const baseFit=L.fit;L.fit=function(){const r=baseFit();fit();return r;};window.addEventListener('alchemy:view-ready',()=>{pick.hidden=true;fit();});window.addEventListener('alchemy:render',fit);window.addEventListener('resize',fit);fit();})();
;
/* === Consolidated source: furnace-view.js === */
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
  const root = 'assets/furnace-view/';
  const controls = document.createElement('div');
  controls.className = 'furnace-controls';
  controls.innerHTML = '<img class="furnace-cover" alt="" draggable="false"><button class="furnace-pill" aria-label="拿起炉内丹药，放到收丹盘" data-focus-key="furnace-pill"></button><button class="furnace-fire" data-focus-key="furnace-fire">催炼</button><button class="furnace-tray" data-focus-key="furnace-tray">收丹盘</button><button class="furnace-resume" data-focus-key="furnace-resume">回到本炉</button>';
  stage.append(controls);
  const pill = controls.querySelector('.furnace-pill');
  const fire = controls.querySelector('.furnace-fire');
  const tray = controls.querySelector('.furnace-tray');
  const resume = controls.querySelector('.furnace-resume');
  const lid = controls.querySelector('.furnace-cover');
  const heading = document.createElement('div');
  heading.className = 'furnace-heading';
  heading.innerHTML = '<button class="furnace-back" data-focus-key="furnace-back">‹ 丹房</button><strong>炉前</strong><button class="furnace-inspect" data-focus-key="furnace-inspect">看丹</button><button class="furnace-manual" data-focus-key="furnace-manual">炉谱</button>';
  nav.prepend(heading);
  const judgment = document.createElement('section');
  judgment.className = 'furnace-judgment';
  judgment.setAttribute('aria-label', '本炉判断');
  judgment.hidden = true;
  judgment.innerHTML = '<div class="furnace-facts"><b></b><div><span></span><small></small></div></div>';
  viewport.append(judgment);
  judgment.append(document.getElementById('refineOdds'), document.querySelector('.refine-odds-toggle'));
  const facts = judgment.querySelector('.furnace-facts');
  let lastLiveKey = '';
  let endingKey = '';
  let fanning = false;
  let drag = null;
  let geometryKey = '';
  let viewportKey = '';
  let fitting = false;

  const live = s => s.started && !s.pillEnded && !s.roundEnded;
  const active = () => route.snapshot().workMode === 'furnace';
  const availableMaterial = () => [...document.querySelectorAll('.herb-slot[aria-disabled=false]')].find(el => el.checkVisibility());
  const rect = (element, r) => {
    for (const name of ['x', 'y', 'w', 'h']) {
      element.style.setProperty({x:'left',y:'top',w:'width',h:'height'}[name], r[name] + 'px', 'important');
    }
  };
  function returnToRoom() {
    if (!route.navigate('work', {workMode:'room'})) return;
    window.dispatchEvent(new Event('alchemy:furnace-leave'));
    requestAnimationFrame(() => {
      (resume.checkVisibility() ? resume : document.querySelector('.world-location-toggle'))?.focus({preventScroll:true});
    });
  }
  heading.querySelector('.furnace-back').onclick = returnToRoom;
  heading.querySelector('.furnace-inspect').onclick = () => route.navigate('pill', {anchor:heading.querySelector('.furnace-inspect')});
  heading.querySelector('.furnace-manual').onclick = () => route.navigate('manual', {anchor:heading.querySelector('.furnace-manual')});
  resume.onclick = () => {
    if (!route.navigate('work', {workMode:'furnace'})) return;
    requestAnimationFrame(() => {
      const target = live(game.snapshot()) ? pill : availableMaterial() || heading.querySelector('.furnace-back');
      target.focus({preventScroll:true});
    });
  };
  fire.onclick = () => window.AlchemyScene2D.refine();
  tray.onclick = () => {
    const s = game.snapshot();
    if (s.pillEnded && s.endReason === 'collect') route.navigate('pill', {anchor:tray});
    else window.AlchemyScene2D.collectHeld();
  };
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
    if (window.AlchemySceneContinuity) return window.AlchemySceneContinuity.fitFurnace();
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
      const host = mobile ? document.body : viewport;
      if (judgment.parentElement !== host) host.append(judgment);
      let reserve = mobile ? Math.max(heightOf('.furnace-judgment'), heightOf('#roomSettlement')) + 12 : 0;
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
      Object.assign(layout.judgment, pointRect(.185,.485,.285,0));
      if (!mobile) {
        judgment.style.left = ((w-width*scale)/2+layout.judgment.x*scale)+'px';
        judgment.style.top = ((h-height*scale)/2+layout.judgment.y*scale)+'px';
        judgment.style.width = Math.min(420,layout.judgment.w*scale)+'px';
      }
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
      endingKey = '';
      if (!window.AlchemyOpening?.active && lastLiveKey !== key) {
        lastLiveKey = key;
        if (!active()) {
          route.navigate('work', {workMode:'furnace', internal:true});
          requestAnimationFrame(() => {pill.focus({preventScroll:true});});
          return;
        }
      }
    } else if (active() && s.started && s.pillEnded && ['collect','explode'].includes(s.endReason) && !window.AlchemyOpening?.active && endingKey !== key) {
      endingKey = key;
      requestAnimationFrame(() => {
        if (route.snapshot().current === 'work' && active())
          document.querySelector('#roomSettlement [data-primary]')?.focus({preventScroll:true});
      });
    }
    const near = active();
    const held = !!window.AlchemyScene2D?.held;
    const collected = s.pillEnded && s.endReason === 'collect';
    const ended = s.pillEnded && ['collect','explode'].includes(s.endReason);
    const locked = s.busy || fanning;
    const blocked = s.busy || fanning || !live(s);
    if (s.busy || fanning) {
      const instruction = document.getElementById('workInstruction');
      instruction.hidden = true;
      instruction.textContent = '';
    }
    controls.dataset.held = held ? 'true' : 'false';
    pill.disabled = blocked;
    heading.querySelector('.furnace-inspect').textContent=s.craftKind?'看物':'看丹';
    pill.setAttribute('aria-label',s.craftKind?'拿起炉内造物，收取入匣':'拿起炉内丹药，收丹入匣');
    pill.setAttribute('aria-disabled', String(blocked || held));
    fire.disabled = blocked || held || s.turn >= 100;
    tray.disabled = locked || (!collected && (!held || blocked));
    tray.setAttribute('aria-label', collected ? '查看收丹盘中的本炉丹药' : '收丹盘');
    controls.dataset.settled = collected ? 'stored' : '';
    heading.querySelector('.furnace-back').disabled = locked || held;
    heading.querySelector('.furnace-inspect').disabled = locked || held || (!live(s) && !collected);
    heading.querySelector('.furnace-manual').disabled = s.busy || fanning || held;
    resume.hidden = near || !s.started || v.current !== 'work' || !!window.AlchemyOpening?.active;
    resume.dataset.entryLabel = live(s) ? '回炉前 ›' : '进炉前 ›';
    resume.setAttribute('aria-label', live(s) ? '返回炉前' : '点击丹炉，进入炉前');
    const campaign = game.campaign();
    const potency = Number.isFinite(s.grossValue) ? s.grossValue : Math.round(s.value + (s.yuanBonus || 0));
    facts.querySelector('b').textContent = s.endReason === 'explode' ? '本炉炸炉' : s.turn+'转 · 药力 '+potency;
    facts.querySelector('span').textContent = ended
      ? collected ? (s.order ? '已入丹匣 · 可交丹' : '已入丹匣') : '未成丹'
      : s.order
      ? '交丹后 '+Math.round(s.delivered+potency)+' / '+s.target
      : '收丹入匣 · 售价估计 '+window.AlchemyEconomy.saleValue(campaign,s)+' 铜钱';
    facts.querySelector('small').textContent = ended && s.roundEnded ? '' : s.order
      ? '本单余料 '+s.remaining+' 包' : '';
    facts.querySelector('small').hidden = !facts.querySelector('small').textContent;
    judgment.hidden = !near || v.current !== 'work' || !live(s);
    if (held && !judgment.style.minHeight) judgment.style.minHeight = judgment.getBoundingClientRect().height+'px';
    if (!held) judgment.style.minHeight = '';
    controls.dataset.closed = fanning || s.busy ? 'true' : 'false';
    if (near) fit();
  }

  window.AlchemyFurnaceView = {fit, returnToRoom, get ending(){return false;}};
  window.addEventListener('alchemy:render', () => {fanning = !!window.AlchemyScene2D?.busy; update();});
  window.addEventListener('alchemy:fanning', () => {fanning = true; update();});
  window.addEventListener('alchemy:carry', update);
  window.addEventListener('alchemy:view-ready', update);
  window.addEventListener('alchemy:opening-finished', () => {lastLiveKey='';update();});
  window.addEventListener('alchemy:order', () => {
    endingKey = ''; lastLiveKey = '';
    if (!live(game.snapshot()) && !active()) route.navigate('work', {workMode:'room', internal:true});
  });
  window.addEventListener('alchemy:world-layout', () => {
    if (!active() && !window.AlchemySceneContinuity) rect(resume, layout.mouth);
  });
  new ResizeObserver(() => {
    // Fitting also positions observed controls. Let the resize observer finish its delivery first.
    requestAnimationFrame(() => { if (active()) fit(); });
  }).observe(judgment);
  update();
})();
;
/* === Consolidated source: furnace-guidance.js === */
/* First-use cues follow actual actions. Only presentation preferences are saved. */
(() => {
  'use strict';
  const game=window.AlchemyGame,route=window.AlchemyViewState,layout=window.AlchemyWorldLayout;
  const stage=document.getElementById('pillStage');
  // Re-light the original painting through an object-shaped mask. Never draw a hit box.
  const ns='http://www.w3.org/2000/svg';
  const svg=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
  const light=svg('svg',{'aria-hidden':'true',class:'furnace-object-light',preserveAspectRatio:'none'});
  const defs=svg('defs'),mask=svg('mask',{id:'furnace-object-mask',maskUnits:'userSpaceOnUse'});
  const filter=svg('filter',{id:'furnace-object-feather',x:'-20%',y:'-20%',width:'140%',height:'140%'});
  const blur=svg('feGaussianBlur',{stdDeviation:'2'});filter.append(blur);
  const shape=svg('path',{fill:'white',filter:'url(#furnace-object-feather)'});
  mask.append(shape);defs.append(filter,mask);
  const painting=svg('image',{mask:'url(#furnace-object-mask)',preserveAspectRatio:'none'});
  light.append(defs,painting);stage.append(light);light.style.display='none';
  let lit=null;
  function clearLight(){if(lit)lit.classList.remove('object-guide-lit');lit=null;light.style.display='none';}
  function illuminate(target,kind){
    if(!['mouth','fire'].includes(kind)){lit=target.querySelector('img')||target;lit.classList.add('object-guide-lit');return;}
    // The living fire is above the painted light; brighten the flame itself too.
    if(kind==='fire'){
      lit=document.getElementById('furnaceLivingFire');
      lit?.classList.add('object-guide-lit');
    }
    const key=(route.snapshot().workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
    const p=window.AlchemySceneProjection?.[key];if(!p)return;
    const r=p[kind],x=r.x*p.width,y=r.y*p.height,w=r.w*p.width,h=r.h*p.height;
    light.setAttribute('viewBox',`0 0 ${p.width} ${p.height}`);
    for(const el of [painting,mask]){el.setAttribute('width',p.width);el.setAttribute('height',p.height);}
    painting.setAttribute('href',stage.dataset.sceneImage||window.AlchemySceneLidLayer.baseImage(key));
    blur.setAttribute('stdDeviation',Math.max(1,w*.025));
    shape.setAttribute('d',kind==='mouth'
      ?`M${x} ${y+h/2} a${w/2} ${h/2} 0 1 0 ${w} 0 a${w/2} ${h/2} 0 1 0 ${-w} 0`
      :`M${x+w*.08} ${y+h} L${x+w*.08} ${y+h*.43} Q${x+w*.15} ${y} ${x+w*.5} ${y} Q${x+w*.88} ${y} ${x+w*.92} ${y+h*.43} L${x+w*.92} ${y+h} Z`);
    light.dataset.object=kind;light.style.display='';
  }
  const preference='tutorial-furnace-v105';
  const saved=window.AlchemySaves.preference(preference)||{};
  let flags={...saved.done},enabled=saved.enabled!==false,previous=game.snapshot(),previousView=route.snapshot(),described=null,queued=false;
  const save=()=>window.AlchemySaves.setPreference(preference,{enabled,done:flags});
  function done(name){if(flags[name])return;flags[name]=true;save();}
  function screenRect(el){
    const a=el.getBoundingClientRect(),b=stage.getBoundingClientRect();
    return{x:(a.x-b.x)*stage.clientWidth/b.width,y:(a.y-b.y)*stage.clientHeight/b.height,w:a.width*stage.clientWidth/b.width,h:a.height*stage.clientHeight/b.height};
  }
  function render(){
    queued=false;
    const s=game.snapshot(),v=route.snapshot(),held=window.AlchemyScene2D.held;
    if(described){described.removeAttribute('aria-describedby');described=null;}
    clearLight();
    toggle.textContent=enabled?'关闭操作指引':'开启操作指引';
    if(v.current!=='work'||document.querySelector('#gameDialogue[open]')||window.AlchemyOpening?.active||!s.started||s.ritualActive||s.busy||window.AlchemyScene2D.busy){window.AlchemyFeedback.setGuide('');return;}
    const near=v.workMode==='furnace',live=!s.pillEnded&&!s.roundEnded;
    let target=null,rect=null,text='';
    if(held==='pill'){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text=s.craftKind?'收取入匣':'收丹入匣';
    }else if(held==='herbs'){
      target=document.getElementById('alchemyScene');rect=layout.mouth;text='投入炉口';
    }else if(near&&live&&s.turn>=100){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text=s.craftKind?'百转已成，收取入匣。':'百转成丹，点击收丹。';
    }else if(!enabled){window.AlchemyFeedback.setGuide('');return;}

    else if(near&&live&&!flags.refine&&s.turn<100){
      target=document.querySelector('.furnace-fire');rect=layout.firebox;text='点火门催炼';
    }else if(near&&s.pillEnded&&['collect','explode'].includes(s.endReason)&&!flags.leave){
      // The receipt already names the next step; highlight its real action only.
      target=document.querySelector('#roomSettlement [data-primary]');text='';
      if(target?.checkVisibility())rect=screenRect(target);
    }else if(near&&s.pillEnded&&!flags.take){
      target=[...document.querySelectorAll('.herb-slot[aria-disabled=false]')].find(el=>el.checkVisibility());
      if(target){rect=screenRect(target);text='取一包药';}
    }
    if(!rect||!target){window.AlchemyFeedback.setGuide('');return;}
    illuminate(target,held==='herbs'?'mouth':target.matches('.furnace-fire')?'fire':'control');
    window.AlchemyFeedback.setGuide(text);
    if(text){target.setAttribute('aria-describedby','refineFeedback');described=target;}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}
  function closeSettings(){const b=document.querySelector('.world-settings-toggle');if(b?.getAttribute('aria-expanded')==='true')b.click();}
  const settings=document.getElementById('worldSettings'),toggle=document.createElement('button'),restart=document.createElement('button');
  toggle.type=restart.type='button';toggle.dataset.focusKey='toggle-furnace-guide';restart.dataset.focusKey='restart-furnace-guide';
  restart.textContent='重新查看操作指引';settings.append(toggle,restart);
  toggle.onclick=()=>{enabled=!enabled;save();closeSettings();schedule();};
  restart.onclick=()=>{flags={};enabled=true;save();closeSettings();schedule();};
  window.addEventListener('alchemy:carry',e=>{if(e.detail.kind==='herbs')done('take');schedule();});
  window.addEventListener('alchemy:refine-result',()=>{done('refine');schedule();});
  window.addEventListener('alchemy:furnace-leave',()=>{if(game.snapshot().pillEnded)done('leave');schedule();});
  window.addEventListener('alchemy:view-ready',()=>{
    const v=route.snapshot();
    if(previousView.location==='work'&&previousView.workMode==='furnace'&&game.snapshot().pillEnded&&(v.location!=='work'||v.workMode!=='furnace'))done('leave');
    previousView=v;schedule();
  });
  window.addEventListener('alchemy:render',()=>{
    const s=game.snapshot();
    if(previous.started&&previous.pillEnded&&!s.pillEnded)done('load');
    previous=s;schedule();
  });
  for(const name of ['alchemy:interaction','alchemy:world-layout','alchemy:opening-finished','resize'])window.addEventListener(name,schedule);
  function observeDialogue(){
    const dialogue=document.getElementById('gameDialogue');
    if(dialogue)new MutationObserver(schedule).observe(dialogue,{attributes:true,attributeFilter:['open']});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',observeDialogue,{once:true});else observeDialogue();
  window.AlchemyFurnaceGuidance={refresh:schedule,get enabled(){return enabled;}};
  render();
})();
;
/* === Consolidated source: scene-projection.js === */
window.AlchemySceneProjection={"room-desktop":{"width":1600,"height":1600,"mouth":{"x":0.25909638357543374,"y":0.4588745879192532,"w":0.1613518010270666,"h":0.039569924624833386},"fire":{"x":0.292987212195029,"y":0.5961496357374031,"w":0.06134436856502423,"h":0.05708114219412885},"pill":{"x":0.3427262147641108,"y":0.497176205120526},"pillDiameter":0.03132948765951865,"tools":[{"foot":{"x":0.5928266816645337,"y":0.5707141361388282},"top":{"x":0.5944096741895087,"y":0.5288076628474196}},{"foot":{"x":0.666,"y":0.595},"top":{"x":0.668,"y":0.553}},{"foot":{"x":0.734,"y":0.608},"top":{"x":0.737,"y":0.566}}],"bodyRight":0.44286409045394026,"book":{"x":0.6023206171571258,"y":0.5901323919735669},"casket":{"x":0.7988948874289681,"y":0.5830407905266801},"door":{"x":0.7209297523157857,"y":0.35741487328622673,"w":0.11181019772259781,"h":0.17810732544767288}},"furnace-desktop":{"width":1600,"height":1600,"mouth":{"x":0.10146566166594628,"y":0.346380770620373,"w":0.34907574487177523,"h":0.1319057736585968},"fire":{"x":0.22420620522222617,"y":0.6762866785626975,"w":0.14241469817840863,"h":0.10418332764173699},"pill":{"x":0.2919488341942954,"y":0.43961648521983177},"pillDiameter":0.06623134628948174,"tools":[{"foot":{"x":0.9677812701969097,"y":0.6420382123232176},"top":{"x":1.0058564898641,"y":0.5566444175573249}},{"foot":{"x":1.1316592779824177,"y":0.6238353249402959},"top":{"x":1.1812567535390852,"y":0.5400295306436359}},{"foot":{"x":1.285140191618392,"y":0.6067873035242665},"top":{"x":1.344684951546114,"y":0.5245487042668511}}],"bodyRight":0.49424553556389306,"book":{"x":1.1169067111133204,"y":0.7553475631407953},"casket":{"x":1.5723786399435005,"y":0.6881962068859377},"door":{"x":0.8162952821519374,"y":0.1340050383094158,"w":0.20433069046510943,"h":0.2786526987780261}},"room-mobile":{"width":390,"height":900,"mouth":{"x":0.10426549154804898,"y":0.43890331488789414,"w":0.29856038442105104,"h":0.027220020016444357},"fire":{"x":0.18327951456837144,"y":0.544875359841248,"w":0.11385069574944179,"h":0.0468017424846463},"pill":{"x":0.2581693722632273,"y":0.4678989271511601},"pillDiameter":0.05892599857798314,"tools":[{"foot":{"x":0.71,"y":0.548},"top":{"x":0.71,"y":0.514}},{"foot":{"x":0.81,"y":0.549},"top":{"x":0.81,"y":0.515}},{"foot":{"x":0.91,"y":0.550},"top":{"x":0.91,"y":0.516}}],"bodyRight":0.4431642145037506,"book":{"x":0.7887754259212119,"y":0.5283099686849939},"casket":{"x":1.1387540232480298,"y":0.5192706412562318},"door":{"x":0.9164975620428069,"y":0.3586337117893358,"w":0.20047242247158237,"h":0.14201647361797842}},"furnace-mobile":{"width":390,"height":900,"mouth":{"x":0.09698712432625783,"y":0.40184003715007466,"w":0.5278252078564636,"h":0.08875010240966957},"fire":{"x":0.21326685731738726,"y":0.6247125545468009,"w":0.19394384794527275,"h":0.0754273104004839},"pill":{"x":0.3659092323360393,"y":0.46833468717407584},"pillDiameter":0.1020065410324763,"tools":[{"foot":{"x":1.325281747597228,"y":0.6570079067709333},"top":{"x":1.3621064165529795,"y":0.5974274078992187}},{"foot":{"x":1.6401760389216313,"y":0.6665095814185019},"top":{"x":1.6919760608817258,"y":0.606278023868796}},{"foot":{"x":1.9662115533297482,"y":0.6763474332526184},"top":{"x":2.0340568180082457,"y":0.6154562718948307}}],"bodyRight":0.6812945342210865,"book":{"x":1.4243841847864682,"y":0.7239991325159844},"casket":{"x":2.2877428524693384,"y":0.7439220712720701},"door":{"x":1.498937824036215,"y":0.2523144420192849,"w":0.5124154882984264,"h":0.24377675378467656}},"toolSprites":[{"l":0.14,"t":0.14333333333333334,"r":0.92,"b":0.97},{"l":0.08333333333333333,"t":0.10666666666666667,"r":0.9266666666666666,"b":0.97},{"l":0.09333333333333334,"t":0.09666666666666666,"r":0.9166666666666666,"b":0.9933333333333333},{"l":0.043333333333333335,"t":0.35333333333333333,"r":0.9733333333333334,"b":0.89},{"l":0.13666666666666666,"t":0.11333333333333333,"r":0.79,"b":0.9733333333333334},{"l":0.05,"t":0.3233333333333333,"r":0.9333333333333333,"b":0.9166666666666666},{"l":0.11,"t":0.17,"r":0.9433333333333334,"b":0.9066666666666666},{"l":0.08,"t":0.09,"r":0.9,"b":0.9566666666666667},{"l":0.12,"t":0.07,"r":0.8833333333333333,"b":0.9533333333333334},{"l":0.13,"t":0.20333333333333334,"r":0.8666666666666667,"b":0.9},{"l":0.1,"t":0.11333333333333333,"r":0.89,"b":0.9333333333333333},{"l":0.08666666666666667,"t":0.05333333333333334,"r":0.89,"b":0.9933333333333333},{"l":0.11,"t":0.09666666666666666,"r":0.9366666666666666,"b":0.8733333333333333},{"l":0.11,"t":0.1,"r":0.8966666666666666,"b":0.87},{"l":0.11,"t":0.11666666666666667,"r":0.89,"b":0.87},{"l":0.10666666666666667,"t":0.11,"r":0.8933333333333333,"b":0.87},{"l":0.10666666666666667,"t":0.12333333333333334,"r":0.8933333333333333,"b":0.87}]};
// The mobile room painting places the firebox higher than the initial anchor trace.
window.AlchemySceneProjection['room-mobile'].fire.y=0.519875359841248;
// Experiment mother art uses the same camera, with the visible bowl centers traced separately.
if (document.body.classList.contains('warm-cinnabar-experiment')) {
  window.AlchemySceneProjection['room-mobile'].pill.y = 397 / 900;
  window.AlchemySceneProjection['furnace-mobile'].pill.y = 392 / 900;
}

// Interior of the painted mobile fire doors, measured on the 390 × 900 artwork.
window.AlchemyWarmFireProjection={
  'room-mobile':{x:73/390,y:474/900,w:44/390,h:37/900},
  'furnace-mobile':{x:88/390,y:539/900,w:74/390,h:54/900}
};
;
/* === Consolidated source: scene-lid-layer.js === */
/* Keep the open painting as the static room where the two lid patches align.
   The experiment's mobile paintings and desktop furnace plates swap as a whole. */
(() => {
  'use strict';

  const directory = key => {
    return document.body.classList.contains('warm-cinnabar-experiment')
      ? 'assets/scene-entry/warm-cinnabar/'
      : key.endsWith('desktop') ? 'assets/scene-entry/' : 'assets/scene-illustrated/';
  };
  const usesFullPlate = key => (key.endsWith('mobile') || key === 'furnace-desktop') &&
    document.body.classList.contains('warm-cinnabar-experiment');
  const patches = {
    'room-desktop': {
      size: [1600, 1600], feather: 4,
      lid: 'M384 759 Q416 725 495 714 Q500 681 545 678 Q583 679 596 720 Q685 733 707 776 Q697 811 634 824 Q500 847 408 816 Q381 801 384 759Z',
      rest: 'M275 671 Q332 665 357 730 Q374 761 381 787 Q398 801 394 841 Q383 866 361 875 Q340 949 296 974 L239 976 Q200 930 211 835 Q200 733 248 685Z'
    },
    'room-mobile': {
      size: [390, 900], feather: 1.5,
      lid: 'M30 389 Q44 374 81 368 Q84 349 104 348 Q122 350 126 370 Q158 375 171 393 Q173 416 133 423 Q68 432 37 413Z',
      rest: 'M-10 358 Q9 367 12 399 Q29 403 30 426 Q26 439 17 443 Q12 463 -10 468Z'
    },
    'furnace-desktop': {
      size: [1600, 1600], feather: 5,
      lid: 'M115 675 Q136 584 365 535 Q366 473 434 466 Q501 462 531 531 Q703 551 770 644 Q815 730 680 782 Q558 842 358 827 Q151 828 115 739Z',
      rest: 'M-16 544 Q15 555 42 603 Q72 653 84 718 Q123 741 119 798 Q115 833 99 849 Q94 961 -16 1055Z'
    },
    'furnace-mobile': {
      size: [390, 900], feather: 1.5,
      lid: 'M22 394 Q42 366 111 358 Q117 343 145 342 Q167 343 178 358 Q237 362 260 398 Q279 434 231 457 Q194 474 128 468 Q49 464 25 439Z',
      rest: 'M-8 393 Q7 408 9 426 Q22 428 21 447 Q17 462 -8 480Z'
    }
  };

  const svgNS = 'http://www.w3.org/2000/svg';
  function element(name, attributes) {
    const node = document.createElementNS(svgNS, name);
    for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, value);
    return node;
  }

  function mount(stage) {
    const layer = element('svg', {'aria-hidden': 'true', preserveAspectRatio: 'none'});
    Object.assign(layer.style, {
      position: 'absolute', left: '0', top: 'var(--scene-image-top)',
      width: 'var(--room-base-width)', height: 'var(--room-base-height)',
      pointerEvents: 'none', zIndex: '0', visibility: 'hidden'
    });
    const defs = element('defs', {});
    const filter = element('filter', {id: 'lid-patch-feather', x: '-20%', y: '-20%', width: '140%', height: '140%'});
    const blur = element('feGaussianBlur', {});
    filter.append(blur);
    const mask = element('mask', {id: 'lid-patch-mask', maskUnits: 'userSpaceOnUse'});
    const footprint = element('path', {fill: 'white', filter: 'url(#lid-patch-feather)'});
    mask.append(footprint);
    defs.append(filter, mask);
    const painting = element('image', {mask: 'url(#lid-patch-mask)', preserveAspectRatio: 'none'});
    layer.append(defs, painting);
    stage.prepend(layer);

    let currentKey, currentLid;
    return (key, lid) => {
      if (usesFullPlate(key)) {
        layer.style.visibility = 'hidden';
        currentLid = null;
        return;
      }
      if (key !== currentKey) {
        const {size: [width, height], feather, lid: lidPath, rest} = patches[key];
        layer.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
        for (const node of [painting, mask]) {
          node.setAttribute('width', width);
          node.setAttribute('height', height);
        }
        blur.setAttribute('stdDeviation', feather);
        footprint.setAttribute('d', lidPath + ' ' + rest);
        painting.setAttribute('href', directory(key) + key + '-closed.webp');
        currentKey = key;
      }
      if (lid !== currentLid) {
        layer.style.visibility = lid === 'closed' ? 'visible' : 'hidden';
        currentLid = lid;
      }
    };
  }

  window.AlchemySceneLidLayer = {
    mount,
    baseImage: (key, lid) => directory(key) + key + (usesFullPlate(key) && lid === 'closed' ? '-closed.webp' : '-open.webp')
  };
})();
;
/* === Consolidated source: scene-runtime.js === */
/* One spatial projection supplies backgrounds, objects and input. Business state stays in AlchemyGame. */
(()=>{'use strict';
 const warm=document.body.classList.contains('warm-cinnabar-experiment');
 const game=window.AlchemyGame,route=window.AlchemyViewState,L=window.AlchemyWorldLayout,P=window.AlchemySceneProjection;
 const stage=document.getElementById('pillStage'),forge=document.querySelector('.forge-panel'),viewport=document.querySelector('.engine-viewport');
 const judgment=document.querySelector('.furnace-judgment'),facts=judgment.querySelector('.furnace-facts'),herbs=document.querySelector('.herb-tray'),collect=document.querySelector('.furnace-tray');viewport.append(collect);
 document.body.classList.add('scene-continuity','scene-spatial','art-repair');let fitting=false,queued=false,geometry='',heldViewport='',stockKey='',notice='',noticeTimer,noticeScope='';
 const drawLid=window.AlchemySceneLidLayer.mount(stage);
 const foreground=document.createElement('div');foreground.className='scene-front-mask';foreground.setAttribute('aria-hidden','true');stage.append(foreground);
 const caption=document.createElement('p');caption.className='scene-value-caption';caption.textContent='药力';judgment.prepend(caption);
 const demand=document.createElement('button');demand.className='scene-demand';demand.type='button';demand.dataset.focusKey='scene-demand';demand.onclick=()=>window.AlchemyLoop.openDemand(demand);
 const shelfNav=document.createElement('div');shelfNav.className='scene-stock-nav';shelfNav.innerHTML='<strong>丹料</strong><span class="scene-balance" aria-label="铜钱"></span><button type="button" data-focus-key="scene-bag" data-scene-view="bag">收纳</button><button type="button" data-focus-key="scene-equipment" data-scene-view="equipment">法器</button>';
 const pills=document.createElement('section');pills.className='scene-pill-stock';pills.setAttribute('aria-label','丹匣丹药');
 const stockStatus=document.createElement('p');stockStatus.className='scene-stock-status';stockStatus.setAttribute('role','status');stockStatus.hidden=true;
 let unavailableAttempt=false;const originalTell=window.AlchemyUX.tell;
 function markUnavailable(e){unavailableAttempt=!!e.target.closest('.herb-slot[aria-disabled=true][data-slot]');setTimeout(()=>{unavailableAttempt=false;},0);}
 herbs.addEventListener('pointerdown',markUnavailable,true);herbs.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')markUnavailable(e);},true);
 window.AlchemyUX.tell=message=>{if(unavailableAttempt){notice=String(message);const s=game.snapshot();noticeScope=[route.snapshot().workMode,s.orderId,s.attempt,s.turn,s.pillEnded].join(':');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice='';schedule();},2800);schedule();}return originalTell(message);};
 herbs.addEventListener('click',e=>{const b=e.target.closest('[data-scene-view]');if(b)route.navigate(b.dataset.sceneView,{anchor:b});const pick=e.target.closest('[data-stock-pill]');if(pick){const id=pick.dataset.stockPill;if(route.navigate('bag',{anchor:pick}))requestAnimationFrame(()=>document.querySelector('.pill-bag-panel [data-pill-id="'+CSS.escape(id)+'"]')?.click());}});
 collect.onclick=()=>{if(window.AlchemyScene2D.held==='pill')window.AlchemyScene2D.collectHeld();else if(!window.AlchemyScene2D.held)game.collect();};
 document.getElementById('roomSettlement').addEventListener('click',e=>{if(e.target.closest('[data-furnace-room]')&&route.snapshot().workMode==='furnace'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('roomSettlement').hidden=true;update();herbs.querySelector('.herb-slot[aria-disabled=false]')?.focus({preventScroll:true});}},true);
 const live=s=>s.started&&!s.pillEnded&&!s.roundEnded;
 const lidState=()=>live(game.snapshot())&&!game.snapshot().busy&&!game.snapshot().ritualActive&&!window.AlchemyScene2D.busy?'open':'closed';
 const rect=(el,r)=>{if(!el)return;for(const [k,n]of Object.entries({left:r.x,top:r.y,width:r.w,height:r.h}))el.style.setProperty(k,n+'px','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');};
 const keyFor=()=> (route.snapshot().workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
 const imageFor=()=>window.AlchemySceneLidLayer.baseImage(keyFor(),lidState());
 function stock(){
  if(!herbs.contains(shelfNav))herbs.prepend(shelfNav);if(!herbs.contains(pills))herbs.append(pills);if(!herbs.contains(stockStatus))shelfNav.after(stockStatus);
  // The experiment uses the dock for inventory in both room and furnace views.
  herbs.hidden=!warm&&route.snapshot().workMode!=='furnace';
  const s=game.snapshot(),scope=[route.snapshot().workMode,s.orderId,s.attempt,s.turn,s.pillEnded].join(':');if(scope!==noticeScope||window.AlchemyScene2D.held)notice='';stockStatus.textContent=notice;stockStatus.hidden=!notice;
  const e=game.campaign()?.economy;if(!e)return;herbs.querySelector('.scene-balance').textContent=String(e.coins);
  const list=Array.isArray(e.pills)?e.pills:[];pills.hidden=!warm&&!list.length;const next=list.map(p=>p.id+':'+p.value+':'+(p.yuanBonus||0)+':'+p.turn+':'+(p.appearance||'plain')).join('|');
  if(next!==stockKey||!pills.childElementCount){stockKey=next;window.AlchemyUX.html(pills,'<div class="scene-pill-caption">收纳 <span>'+list.length+'</span></div>'+(list.length?'<div class="scene-pill-row">'+list.map(p=>{const v=window.AlchemyEconomy.grossValue(p);return '<button type="button" data-stock-pill="'+p.id+'" data-focus-key="stock-pill-'+p.id+'" aria-label="查看'+p.turn+'转丹药，药力'+v+'">'+window.AlchemyUX.art(p)+'<span>'+v+'</span></button>';}).join('')+'</div>':warm?'<p class="warm-stock-empty">暂无成品</p>':''));}
  herbs.querySelectorAll('.herb-slot[data-slot]').forEach(el=>{const title=el.getAttribute('title')||'';el.dataset.shortLabel=(title.includes('委托供料')||title.includes('本单供料'))?'本单料':title.startsWith('本炉药包')?'本炉料':title.startsWith('普通药包')?'普通料':title.startsWith('精选药包')?'精选料':title.split(' · ')[0];});
 }
 function fit(){if(fitting)return true;fitting=true;try{
  const s=game.snapshot(),v=route.snapshot(),near=v.workMode==='furnace',mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,data=P[keyFor()];if(!w||!h||!data)return true;
  const mobileDock=mobile&&warm&&near&&live(s)&&v.current==='work';
  const desktopCard=!mobile&&warm&&near&&live(s)&&v.current==='work';
  document.body.dataset.mobileFurnaceDock=mobileDock?'true':'';
  document.body.dataset.desktopFurnaceCard=desktopCard?'true':'';
  const viewportKey=[near,w,h].join(':');if(window.AlchemyScene2D.held&&heldViewport===viewportKey)return true;heldViewport=viewportKey;
  if(judgment.parentElement!==viewport)viewport.append(judgment);if(herbs.parentElement!==viewport)viewport.append(herbs);
  const items=Math.max(herbs.querySelectorAll('.herb-slot[data-slot]').length,game.campaign()?.economy?.pills?.length||0),dockWidth=mobile?w:Math.min(420,Math.max(248,Math.min(6,items)*68+24));if(mobile||!window.AlchemyWarmStyle||!matchMedia('(pointer:fine)').matches)herbs.style.setProperty('width',dockWidth+'px','important');
  const width=mobile?w:1600,imageHeight=width*data.height/data.width,sidebar=!mobile&&window.AlchemyWarmStyle&&matchMedia('(pointer:fine)').matches&&herbs.dataset.sceneVisible==='true',scale=sidebar?Math.max(w/width,h/imageHeight):w/width,height=h/scale;
  // Reserve a stable interaction area from the projection, never from changing UI content.
  // On short screens keep both the mouth and the complete fire hit region above the dock.
  const fireAnchor=(warm&&window.AlchemyWarmFireProjection[keyFor()])||data.fire;
  const fireBottom=(fireAnchor.y+fireAnchor.h/2)*imageHeight+Math.max(fireAnchor.h*imageHeight,44/scale)/2;
  const minimumScene=Math.ceil(Math.max(imageHeight*(1-2*data.mouth.y),2*fireBottom-imageHeight)*scale+16);
  const stockLimit=mobile?Math.max(112,Math.min(410,h-minimumScene,h*.56)):Math.min(360,h*.48);
  const stockBorder=Math.max(0,herbs.offsetHeight-herbs.clientHeight);
  const stockHeight=Math.max(112,Math.min(stockLimit,herbs.scrollHeight+stockBorder));
  const mobileRoomDock=Math.min(220,h*0.30),visibleRoomH=mobile&&!near?Math.max(245,h-mobileRoomDock):h;
  const sceneH=mobile?Math.max(245,h-stockLimit):h,top=mobile&&!near?Math.min(0,Math.max(h/scale-imageHeight,(visibleRoomH/scale)*0.50-0.44*imageHeight)):(sceneH/scale-imageHeight)/2;
  const next=[near,mobile,w,h,sceneH,width,height].join(':');if(window.AlchemyScene2D.held&&geometry&&geometry!==next)window.AlchemyScene2D.cancel();
  document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',!mobile&&w<1280);
  viewport.style.setProperty('--work-top','0px');document.body.style.setProperty('--work-reserve','0px');
  for(const el of [stage,forge]){for(const [k,n]of Object.entries({'--world-width':width,'--world-height':height,'--room-base-width':width,'--room-base-height':imageHeight,'--room-camera-left':0}))el.style.setProperty(k,n+'px');el.style.setProperty('width',width+'px','important');el.style.setProperty('height',height+'px','important');}
  stage.style.setProperty('--scene-scale',String(scale));stage.style.setProperty('--scene-image-top',top+'px');forge.style.left='0';forge.style.top='0';forge.style.transform='scale('+scale+')';forge.style.transformOrigin='0 0';
  const canvas=document.getElementById('alchemyScene');if(canvas.width!==Math.round(width))canvas.width=Math.round(width);if(canvas.height!==Math.round(height))canvas.height=Math.round(height);
  const lid=lidState(),src=imageFor();drawLid(keyFor(),lid);stage.style.setProperty('--scene-image','url("'+src+'")');const desktopDirectory=document.body.classList.contains('warm-cinnabar-experiment')?'assets/scene-entry/warm-cinnabar/':'assets/scene-entry/';stage.style.setProperty('--scene-front-image','url("'+(document.body.classList.contains('warm-cinnabar-experiment')?desktopDirectory:mobile?'assets/scene-illustrated/':desktopDirectory)+keyFor()+'-front.webp")');foreground.hidden=s.ritualActive||!live(s)||!!window.AlchemyScene2D.held||s.busy||window.AlchemyScene2D.busy;stage.dataset.sceneImage=src;stage.dataset.lidState=lid;stage.dataset.camera='work';stage.dataset.cameraCropped='false';
  const point=p=>({x:p.x*width,y:top+p.y*imageHeight}),project=r=>({x:r.x*width,y:top+r.y*imageHeight,w:r.w*width,h:r.h*imageHeight});
  // Place the trace on the clay between the projected mouth and the firebox.
  const mouth=project(data.mouth),fire=project(fireAnchor);
  const cx=(mouth.x+mouth.w/2)*scale, rim=(mouth.y+mouth.h)*scale, grate=fire.y*scale;
  const riteCenterY=(rim+grate)/2;
  const runeWidth=Math.max(156,Math.min(330,mouth.w*scale*.88));
  viewport.style.setProperty('--rite-fire-x',(fire.x+fire.w/2)*scale+'px');
  viewport.style.setProperty('--rite-fire-y',(fire.y+fire.h/2)*scale+'px');
  viewport.style.setProperty('--rite-fire-w',fire.w*scale+'px');
  viewport.style.setProperty('--rite-x',cx+'px');
  viewport.style.setProperty('--rite-y',riteCenterY+'px');
  viewport.style.setProperty('--rite-w',runeWidth+'px');
  viewport.style.setProperty('--rite-h',Math.max(150,Math.min(runeWidth*.86,(grate-rim)*1.05))+'px');
  viewport.dataset.rite=near&&v.current==='work'?(s.ritualActive?'trace':s.ritualRemaining?'sealed':''):'';
  const minimum=(r,min=44/scale)=>{const nw=Math.max(r.w,min),nh=Math.max(r.h,min);return{x:r.x-(nw-r.w)/2,y:r.y-(nh-r.h)/2,w:nw,h:nh};};
  Object.assign(L.mouth,minimum(mouth));Object.assign(L.firebox,minimum(fire));
  const fireTop=Math.min(fire.y,L.firebox.y)*scale;
  const arcW=Math.max(124,Math.min(236,Math.max(fire.w*scale*1.52,mouth.w*scale*.66)));
  const arcGap=Math.max(0,fireTop-rim);
  const arcBottom=fireTop-Math.max(6,Math.min(16,arcGap*.1));
  viewport.style.setProperty('--rite-arc-x',(fire.x+fire.w/2)*scale+'px');
  viewport.style.setProperty('--rite-arc-y',arcBottom+'px');
  viewport.style.setProperty('--rite-arc-w',arcW+'px');
  const center=point(data.pill),diameter=data.pillDiameter*width*(s.craftKind?(near?2.6:1.5):1),size=Math.max(48/scale,diameter),shape=s.craftKind?window.AlchemyPillArt.geometry(s):null;let contact=null;
  if(shape){const base=mouth.y+mouth.h*.73,footprint={bird:.34,lion:.7,home:.85,beast:.65,tower:.85,spring:.85}[s.craftKind]||.7;center.y=base-diameter*shape.h/2;contact={x:center.x,y:base+diameter*.01,rx:Math.min(diameter*shape.w*footprint/2,mouth.w*.22),ry:Math.min(diameter*.045,mouth.h*.09),mouth:{...mouth}};}
  Object.assign(L.objects.pill,{x:center.x-size/2,y:center.y-size/2,w:size,h:size,visualDiameter:diameter,contact});L.cutaway.source=null;
  // Only the painted lip crossing the pill can occlude it. Leave the furnace body on the shared backdrop.
  foreground.style.clipPath='circle('+(diameter/2+2)+'px at '+center.x+'px '+center.y+'px)';
  rect(document.querySelector('.furnace-pill'),L.objects.pill);rect(document.querySelector('.furnace-fire'),L.firebox);rect(document.getElementById('fireResponse'),L.firebox);if(!near){
    const height=L.firebox.y+L.firebox.h-L.mouth.y;
    const lidClearance=Math.max(18/scale,height*.2);
    rect(document.querySelector('.furnace-resume'),{x:L.mouth.x,y:L.mouth.y-lidClearance,w:L.mouth.w,h:height+lidClearance});
  }
  if(mobileDock){
   rect(judgment,{x:0,y:0,w,h:160});judgment.style.removeProperty('height');
   const jh=Math.ceil(judgment.getBoundingClientRect().height);
   const jTop=Math.max(8,h-jh);
   judgment.style.setProperty('top',jTop+'px','important');
   Object.assign(L.judgment,{x:0,y:jTop,w,h:jh});
   const cw=w<=340?78:88,padR=w<=340?8:12,cxBtn=w-cw-padR,cyBtn=jTop+9;
   rect(collect,{x:cxBtn,y:cyBtn,w:cw,h:44});
   Object.assign(L.objects.tray,{x:cxBtn/scale,y:cyBtn/scale,w:cw/scale,h:44/scale});
  }else if(desktopCard){
   const minW=216,maxW=286,padRight=12;
   const x=Math.max(12,Math.min(w-minW-padRight,Math.max(Math.round(w*0.522),Math.round(data.bodyRight*w+28))));
   const jw=Math.min(maxW,Math.max(minW,w-x-padRight));
   const jy=Math.round((top+(data.mouth.y+data.mouth.h)*imageHeight)*scale+10);
   rect(judgment,{x,y:jy,w:jw,h:240});judgment.style.removeProperty('height');
   const jh=Math.ceil(judgment.getBoundingClientRect().height);
   const adjustedY=Math.max(8,Math.min(jy,sceneH-jh-10));
   judgment.style.setProperty('top',adjustedY+'px','important');
   Object.assign(L.judgment,{x,y:adjustedY,w:jw,h:jh});
   const padX=13,padB=12,btnH=44;
   const bx=x+padX,by=adjustedY+jh-padB-btnH,bw=Math.max(90,jw-padX*2);
   rect(collect,{x:bx,y:by,w:bw,h:btnH});
   Object.assign(L.objects.tray,{x:bx/scale,y:by/scale,w:bw/scale,h:btnH/scale});
  }else{
   const x=Math.min(w-76,Math.max(mobile?w*.72:w*.54,data.bodyRight*w+(mobile?10:44))),jw=Math.min(mobile?110:190,w-x-(mobile?3:8)),jy=(top+(data.mouth.y+data.mouth.h)*imageHeight)*scale+(mobile?34:16);
   rect(judgment,{x,y:jy,w:jw,h:220});judgment.style.removeProperty('height');
   const jh=judgment.getBoundingClientRect().height,cy=Math.min(sceneH-52,Math.max(jy+jh+10,0)),adjustedY=Math.min(jy,cy-jh-10);
   judgment.style.setProperty('top',Math.max(8,adjustedY)+'px','important');Object.assign(L.judgment,{x,y:Math.max(8,adjustedY),w:jw,h:jh});
   rect(collect,{x,y:Math.max(8,adjustedY)+jh+10,w:Math.min(90,jw),h:44});Object.assign(L.objects.tray,{x:x/scale,y:(Math.max(8,adjustedY)+jh+10)/scale,w:Math.min(90,jw)/scale,h:44/scale});
  }
  const row=document.querySelector('.world-tool-row');rect(row,{x:0,y:0,w:width,h:height});L.toolRest.slots=[];
  [...row.children].forEach((el,i)=>{const slot=data.tools[i],foot=point(slot.foot),tip=point(slot.top),visual=Math.abs(foot.y-tip.y),r={x:foot.x-visual/2,y:foot.y-visual,w:visual,h:visual},interactive=!mobile&&visual*scale>=44;L.toolRest.slots.push(r);rect(el,r);el.style.setProperty('position','absolute','important');el.style.setProperty('--tool-size',visual+'px');el.style.pointerEvents=interactive?'auto':'none';el.tabIndex=interactive?0:-1;el.setAttribute('aria-hidden',String(!interactive));
   const art=el.querySelector('[data-tool-art]'),index=window.AlchemyEconomy.TOOL_DEFS.findIndex(t=>t.id===art?.dataset.toolArt),bounds=window.AlchemyWarmProps?.tools[art?.dataset.toolArt]?.bounds||P.toolSprites[index];if(art&&bounds){const frame=visual/(bounds.b-bounds.t);el.style.setProperty('--tool-art-size',frame+'px');el.style.setProperty('--tool-art-left',(visual/2-frame*(bounds.l+bounds.r)/2)+'px');el.style.setProperty('--tool-art-top',(visual-frame*bounds.b)+'px');}
  });
  Object.assign(L.toolRest,{x:0,y:0,w:width,h:height});Object.assign(L.objects.tool,{x:-300,y:-300,w:100,h:100});
  const book=point(data.book),casket=point(data.casket),door=minimum(project(data.door));if(mobile&&!near){const mw=Math.min(door.w,72/scale);door.x=Math.min(door.x,width-mw-6/scale);door.w=mw;}rect(document.querySelector('.world-book-stack'),{x:book.x-48/scale,y:book.y-30/scale,w:96/scale,h:48/scale});rect(document.querySelector('.world-books'),{x:book.x-48/scale,y:book.y-30/scale,w:96/scale,h:48/scale});rect(document.querySelector('.world-casket'),{x:casket.x-28/scale,y:casket.y-24/scale,w:56/scale,h:48/scale});rect(document.querySelector('.passage-counter'),door);
  const maxBottom=mobile&&!near?Math.max(245,h-stockHeight):sceneH;
  for(const sel of ['.world-book-stack','.world-books','.world-casket','.passage-counter']){const el=document.querySelector(sel);const r=el.getBoundingClientRect();el.style.visibility=near||r.right>w||r.left<0||r.bottom>maxBottom||r.width<40?'hidden':'visible';}
  if(!mobile&&window.AlchemyWarmStyle&&matchMedia('(pointer:fine)').matches){
   for(const name of ['left','top','width','height','--stock-max-height'])herbs.style.removeProperty(name);
   herbs.style.setProperty('--warm-stock-top',Math.max(0,viewport.getBoundingClientRect().top)+'px');
  }else{
   rect(herbs,{x:mobile?0:w-dockWidth-12,y:mobile?h-stockHeight:Math.max(0,h-stockHeight-12),w:dockWidth,h:stockHeight});herbs.style.removeProperty('height');herbs.style.setProperty('--stock-max-height',(mobile?stockLimit:stockHeight)+'px');
  }
  if(geometry!==next){geometry=next;window.dispatchEvent(new Event('alchemy:world-layout'));}return true;
 }finally{fitting=false;}}
 function update(){const s=game.snapshot(),v=route.snapshot(),near=v.workMode==='furnace',heading=document.querySelector('.furnace-heading');
  document.body.dataset.mobileFurnaceDock=(innerWidth<=650&&warm&&near&&live(s)&&v.current==='work')?'true':'';
  document.body.dataset.desktopFurnaceCard=(innerWidth>650&&warm&&near&&live(s)&&v.current==='work')?'true':'';
  stock();
  const host=near?heading:document.querySelector('.engine-nav');if(demand.parentElement!==host)host.append(demand);demand.hidden=v.location!=='work'||!s.order||s.roundEnded;demand.textContent=warm?'交丹进度 '+Math.round(s.delivered)+'\u00a0/\u00a0'+s.target:(s.order?.client||'委托')+' · 还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'药力';demand.setAttribute('aria-label',(warm?'委托要求，':'查看完整需求，')+'目标'+s.target+'药力，已交'+Math.round(s.delivered)+'，还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'药力');
  caption.textContent=s.craftKind?window.AlchemyCrafts.name(s)+' · 估值':'药力';
  const amount=facts.querySelector('b');amount.textContent=Math.round(s.value);amount.style.fontSize=amount.textContent.length>7?(innerWidth<=340?'14px':'18px'):amount.textContent.length>4?'22px':innerWidth<=650?'28px':'32px';amount.style.setProperty('--mobile-potency-size',amount.textContent.length>7?'18px':amount.textContent.length>5?'22px':'26px');amount.style.lineHeight='1.2';facts.querySelector('span').textContent=s.turn+'转';facts.querySelector('small').hidden=true;
  judgment.hidden=!near||v.current!=='work'||!live(s);
  const back=heading.querySelector('.furnace-back');back.textContent='‹';back.setAttribute('aria-label','返回炼丹房');
  herbs.classList.add('scene-stock');herbs.dataset.sceneVisible=String(v.location==='work'&&v.current==='work'&&document.getElementById('roomSettlement').hidden);
  document.body.dataset.sceneAtWork=String(v.location==='work');document.body.dataset.sceneReading=String(v.reading);
  collect.dataset.sceneLabel=s.craftKind?'收取':'收丹';collect.setAttribute('aria-label',s.craftKind?'收取造物入匣':'收丹');collect.hidden=!near||v.current!=='work'||!live(s);collect.dataset.held=String(window.AlchemyScene2D.held==='pill');collect.disabled=!live(s)||s.busy||s.ritualActive||window.AlchemyScene2D.busy||!!(window.AlchemyScene2D.held&&window.AlchemyScene2D.held!=='pill');
  const restock=document.querySelector('[data-furnace-room]');if(restock)restock.textContent='继续取料';fit();
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});};
 window.AlchemySceneContinuity={fitFurnace:fit,fitRoom:fit,imageFor,lidState,get image(){return imageFor();},version:128};L.fit=fit;
 for(const event of ['alchemy:render','alchemy:fanning','alchemy:interaction','alchemy:carry','alchemy:view-ready','alchemy:order','alchemy:opening-finished','alchemy:ux-layout','resize'])window.addEventListener(event,schedule);
 const ro=new ResizeObserver(schedule);ro.observe(viewport);ro.observe(judgment);update();
})();
;
/* === Consolidated source: furnace-surface.js === */
/* Visual backing only: measure existing controls without moving their hit regions. */
(() => {
 'use strict';
 const judgment=document.querySelector('.furnace-judgment'),collect=document.querySelector('.furnace-tray'),viewport=document.querySelector('.engine-viewport'),stock=document.querySelector('.herb-tray');
 if(!judgment||!collect||!viewport)return;
 document.body.classList.add('furnace-solid-surface');
 const backing=document.createElement('div');backing.className='furnace-surface-backing';backing.setAttribute('aria-hidden','true');backing.hidden=true;judgment.before(backing);
 let queued=false;
 function update(){
  queued=false;
  if(judgment.hidden||collect.hidden||viewport.dataset.rite==='trace'||document.body.dataset.mobileFurnaceDock==='true'||document.body.dataset.desktopFurnaceCard==='true'){backing.hidden=true;return;}
  const j=judgment.getBoundingClientRect(),c=collect.getBoundingClientRect(),v=viewport.getBoundingClientRect(),s=stock?.getBoundingClientRect();
  if(!j.width||!c.height){backing.hidden=true;return;}
  const leftPad=Math.max(0,Math.min(12,j.left-v.left-3)),rightPad=Math.max(0,Math.min(12,v.right-j.right-3));
  const bottomEdge=Math.max(j.bottom,c.bottom);
  const bottomPad=Math.max(2,Math.min(10,(s?.height?s.top:v.bottom)-bottomEdge-4));
  const box={left:(j.left-v.left-leftPad)+'px',top:(j.top-v.top-12)+'px',width:(j.width+leftPad+rightPad)+'px',height:(bottomEdge-j.top+12+bottomPad)+'px'};
  backing.hidden=false;
  for(const [k,val]of Object.entries(box))if(backing.style[k]!==val)backing.style[k]=val;
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(update);};
 for(const event of ['alchemy:render','alchemy:assets-ready','alchemy:world-layout','alchemy:ux-layout','alchemy:interaction','alchemy:carry','alchemy:view-ready','resize'])window.addEventListener(event,schedule);
 const observer=new ResizeObserver(schedule);for(const el of [judgment,collect,viewport,stock].filter(Boolean))observer.observe(el);
 schedule();
})();
;
/* === Consolidated source: loop.js === */
/* Inventory, furnace and commission are independent. UI never settles a viewed pill. */
(() => {
 'use strict';
 const game=window.AlchemyGame,E=window.AlchemyEconomy,UX=window.AlchemyUX,route=window.AlchemyViewState;
 const stock=document.querySelector('.herb-tray'),viewport=document.querySelector('.engine-viewport');
 const warm=document.body.classList.contains('warm-cinnabar-experiment');
 document.body.classList.add('loop');
 const selection=document.createElement('section');selection.className='loop-selection';selection.setAttribute('aria-label','选中丹药');selection.hidden=true;stock.append(selection);
 const next=document.createElement('div');next.className='loop-next';stock.append(next);
 const back=document.createElement('button');back.type='button';back.className='loop-return';back.textContent='放回';back.setAttribute('aria-keyshortcuts','Escape');back.hidden=true;viewport.append(back);
 const letter=document.createElement('section');letter.className='loop-letter journal-book';letter.setAttribute('aria-label','当前委托来笺');document.querySelector('.game-layout').append(letter);route.register('demand',letter);
 let selected=null,queued=false,revealSelected=false,origin=null,notice='',noticeUntil=0,noticeTimer;
 function html(el,s){if(el.innerHTML!==s)UX.html(el,s);}
 function actionButton(kind,id,label,extra=''){
  const icons={submit:'submit-mark.svg',sell:'sale-mark.svg',consign:'consign-mark.svg'};
  const filename=icons[kind], icon=filename?(window.AlchemyWarmProps?.resolve('assets/ui/'+filename)||'assets/ui/'+filename):null;
  return '<button class="loop-action-button loop-action-'+kind+'" data-loop-'+kind+'="'+UX.esc(id)+'"'+extra+'>'+(icon?'<img src="'+icon+'" alt="" aria-hidden="true">':'')+'<span>'+label+'</span></button>';
 }
 function busy(s){return s.busy||window.AlchemyScene2D.busy||!!window.AlchemyScene2D.held||!!window.AlchemyInteractionBusy;}
 function terminate(){UX.confirm({title:'终止本单',message:'未用本单料退还，本单记为未完成。丹匣丹药保留，免赔。',confirmLabel:'终止并退还',onConfirm:()=>game.abandonOrder()});}
 function openDemand(anchor){const s=game.snapshot();if(!s.commission)return;renderLetter();route.navigate('demand',{anchor});}
 function renderLetter(){const s=game.snapshot(),o=s.commission;if(!o)return;html(letter,'<header class="journal-heading"><h2>'+UX.esc(o.name)+'</h2><button data-close-demand>合上 ×</button></header><div class="loop-letter-body"><p>'+UX.esc(o.client)+' · 来客手书</p><dl><dt>所求药力</dt><dd>'+o.target+'</dd><dt>已交药力</dt><dd>'+Math.round(s.delivered)+'</dd><dt>还需</dt><dd>'+Math.max(0,Math.ceil(o.target-s.delivered))+'</dd><dt>本单余料</dt><dd>'+s.remaining+' 包</dd><dt>约定工钱</dt><dd>'+E.fee(o)+' 铜钱，超额药力每点补1铜钱</dd></dl><p>收丹先入匣。选中丹药后点“交丹”，本单按全额药力累计，达标即结单。成丹转售先抵每包24文客料款。炸炉免赔，结单后余料赠留。</p></div>');}
 letter.addEventListener('click',e=>{if(e.target.closest('[data-close-demand]'))route.close();});letter.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();route.close();}});
 function showNotice(text){notice=text;noticeUntil=performance.now()+1600;clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice='';schedule();},1600);}
 function consignmentSummary(q){return q?.quote?.guaranteedPayout?`寄售${q.quote.waitDays}天后回款 ${q.quote.guaranteedPayout} 铜钱 · ${q.quote.tierName}`:'';}
 function trade(kind,id){const p=game.campaign()?.economy.pills.find(p=>p.id===id);if(!p)return;selected=null;const ok=kind==='submit'?game.submit(id):kind==='consign'?game.economyAction('consign',id):game.economyAction('sell',id);if(!ok){selected=id;showNotice('未处理，请重新查看。');}else{const s=game.snapshot();showNotice(kind==='submit'?(s.commission?'已交丹 · '+Math.round(s.delivered)+' / '+s.target:'本单已结清'):kind==='consign'?'已寄售，等待回款':'已出售');}schedule();}
 stock.addEventListener('click',e=>{
   const card=e.target.closest('[data-stock-pill]'),sell=e.target.closest('[data-loop-sell]'),submit=e.target.closest('[data-loop-submit]'),consign=e.target.closest('[data-loop-consign]'),inspect=e.target.closest('[data-loop-inspect]'),clear=e.target.closest('[data-loop-clear]');
   if(!card&&!sell&&!submit&&!consign&&!inspect&&!clear)return;e.preventDefault();e.stopImmediatePropagation();const s=game.snapshot();if(busy(s)){UX.tell('先处理或放回手中物件。');return;}
   if(card){selected=card.dataset.stockPill;revealSelected=true;notice='';}else if(clear)selected=null;else if(submit)trade('submit',submit.dataset.loopSubmit);else if(consign){
    const id=consign.dataset.loopConsign;
    if(warm){const q=game.previewConsignment(id);if(q.ok)UX.confirm({title:'确认寄售',message:consignmentSummary(q),confirmLabel:'寄售',onConfirm:()=>trade('consign',id)});}
    else trade('consign',id);
   }else if(sell)trade('sell',sell.dataset.loopSell);else if(inspect){if(route.navigate('bag',{anchor:inspect}))requestAnimationFrame(()=>document.querySelector('.pill-bag-card[data-pill-id="'+CSS.escape(selected)+'"]')?.click());}schedule();
 },true);
 next.addEventListener('click',e=>{if(e.target.closest('[data-loop-close-day]'))route.navigate('orders');if(e.target.closest('[data-loop-stop]'))terminate();if(e.target.closest('[data-loop-market]'))window.AlchemyMerchantVisit.call();});
 back.onclick=()=>{window.AlchemyScene2D.cancel();UX.clearInstruction();schedule();if(origin?.isConnected&&origin.checkVisibility())origin.focus({preventScroll:true});};
 function render(){
  queued=false;const s=game.snapshot(),c=game.campaign(),v=route.snapshot();if(!c)return;const atWork=v.current==='work'&&!window.AlchemyOpening?.active,pills=c.economy.pills;
  if(!Array.isArray(pills))return;const p=pills.find(p=>p.id===selected);if(!p)selected=null;
  // A material repaint may not remove these independent controls.
  if(!stock.contains(selection))stock.append(selection);if(!stock.contains(next))stock.append(next);
  document.getElementById('roomSettlement').hidden=true;
  stock.dataset.sceneVisible=String(atWork);const stockTitle=stock.querySelector('.scene-stock-nav strong');if(stockTitle){const readyToLoad=v.workMode==='furnace'&&s.pillEnded&&stock.querySelector('.herb-slot[aria-disabled=false]');
    stockTitle.textContent=notice&&performance.now()<noticeUntil?notice:readyToLoad?'取药投炉':'丹料';stockTitle.setAttribute('role','status');}const demand=document.querySelector('.scene-demand');demand.hidden=!s.commission||v.location!=='work';
  stock.querySelectorAll('[data-stock-pill]').forEach(el=>{const item=pills.find(p=>p.id===el.dataset.stockPill);el.setAttribute('aria-pressed',String(el.dataset.stockPill===selected));el.setAttribute('aria-label','选中丹药，药力'+(item?E.grossValue(item):''));});
   const locked=busy(s),disabled=locked?' disabled':'',q=p&&game.previewSubmission(p.id),cq=p&&game.previewConsignment(p.id);
  selection.hidden=!p;
  if(p){
   const preview=UX.submissionSummary(q);
   const consignPreview=consignmentSummary(cq);
   const consignDisabled=cq?.ok?'':' disabled';
   html(selection,'<div class="loop-selected-heading"><strong>'+p.turn+'转 · '+(p.craftKind?window.AlchemyCrafts.name(p)+' · 估值 ':'药力 ')+E.grossValue(p)+'</strong><button data-loop-inspect aria-label="查看选中物品">看丹</button><button data-loop-clear aria-label="取消选中丹药">×</button></div>'
    +(preview?'<p class="loop-preview">'+preview+'</p>':'')+'<div class="loop-trades">'
    +(q.ok?actionButton('submit',p.id,'交丹',disabled):'')+actionButton('sell',p.id,(p.materialAdvance?'抵料后出售 · ':'立即出售 · ')+E.saleValue(c,p)+' 铜钱',disabled)
    +(!p.craftKind&&cq?.quote?actionButton('consign',p.id,'寄售',consignDisabled+(warm&&!cq.ok?' title="'+UX.esc(cq.reason||'')+'"':'')):'')+'</div>'
    +(!warm&&!p.craftKind&&consignPreview?'<p class="loop-consignment-note">'+consignPreview+(cq.ok?'':' · '+UX.esc(cq.reason))+'</p>':''));
  }
  else html(selection,notice?'<p class="loop-notice" role="status">'+UX.esc(notice)+'</p>':'');
  const pending=c.orders.some(o=>o.status==='pending');let footer='';if(c.phase==='open'&&!s.commission){if(!pending)footer='<button data-loop-close-day'+(locked?' disabled':'')+'>回柜台收工</button>';if(!s.order||s.order.status!=='active')footer+=c.economy.stock[0]<=1?'<button data-loop-market'+disabled+'>请何采药送药</button>':'';}
  else if(s.commission&&s.pillEnded&&s.remaining===0)footer='<span>本单料已尽 · 还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'</span><button data-loop-stop'+disabled+'>终止本单</button>';
  html(next,footer);next.hidden=!footer;
  back.hidden=!atWork||!['herbs','pill'].includes(window.AlchemyScene2D.held);if(!back.hidden){const sr=stock.getBoundingClientRect(),vr=viewport.getBoundingClientRect();back.style.left=Math.max(8,Math.min(vr.width-80,sr.left-vr.left+8))+'px';back.style.top=Math.max(8,sr.top-vr.top-52)+'px';}
  if(v.current==='demand'){renderLetter();document.querySelector('.engine-close').hidden=true;}
  window.AlchemyWorldLayout.fit();
  if (atWork && revealSelected) {
   revealSelected=false;
   UX.revealSubmission(stock, selection.querySelector('.loop-preview'), selection.querySelector('[data-loop-submit]'));
  }
  const amount=document.querySelector('.furnace-facts b');if(amount?.checkVisibility()){const natural=amount.scrollWidth,available=Math.min(amount.clientWidth,amount.parentElement.clientWidth);if(natural>available&&available>0)amount.style.setProperty('font-size',Math.max(12,parseFloat(getComputedStyle(amount).fontSize)*available/natural*.96)+'px','important');}
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}
 window.addEventListener('alchemy:pill-stored',e=>{
  selected=e.detail.id;revealSelected=true;notice='';schedule();
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
   const b=stock.querySelector('[data-stock-pill="'+CSS.escape(selected||'')+'"]');
   if (!b?.checkVisibility() || route.snapshot().current!=='work') return;
   if (!selection.querySelector('[data-loop-submit]')) b.scrollIntoView({block:'nearest',inline:'nearest'});
   b.focus({preventScroll:true});
  }));
 });
 window.addEventListener('alchemy:inventory-action',e=>{if(selected===e.detail.id)selected=null;schedule();});
 window.addEventListener('alchemy:pill-returned',()=>{selected=null;notice='';schedule();});
 window.addEventListener('alchemy:carry',e=>{if(e.detail.kind)origin=document.activeElement;schedule();});
 for(const e of ['alchemy:render','alchemy:interaction','alchemy:ux-layout','alchemy:view-ready','alchemy:world-layout','alchemy:opening-finished','resize'])window.addEventListener(e,schedule);
 window.AlchemyLoop={openDemand,get selected(){return selected;},version:143};schedule();
})();
