(() => {
  'use strict';
  const stage=document.getElementById('pillStage'),observation=document.querySelector('.room-observation'),settlement=document.getElementById('roomSettlement'),choices=document.getElementById('roomChoices'),herbs=document.querySelector('.herb-tray'),instruction=document.getElementById('workInstruction'),feedback=document.getElementById('refineFeedback');
  const surfaces=[observation,settlement,choices,herbs,instruction,feedback];
  const preview=observation.querySelector('.observation-pill');
  preview.removeAttribute('aria-hidden');preview.setAttribute('role','button');preview.tabIndex=0;preview.setAttribute('aria-label','拿起丹药，放入收丹盘');
  let drag=null,queued=false,lastView=window.AlchemyViewState.snapshot().current;
  preview.addEventListener('pointerdown',e=>{if(e.button!==0||!window.AlchemyScene2D.takePill(e))return;e.preventDefault();preview.setPointerCapture(e.pointerId);drag={x:e.clientX,y:e.clientY,moved:false};});
  preview.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;window.AlchemyScene2D.movePill(e);});
  preview.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)window.AlchemyScene2D.dropPill(e);});
  preview.addEventListener('pointercancel',()=>{drag=null;window.AlchemyScene2D.cancel();});
  preview.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;e.preventDefault();e.stopPropagation();const r=preview.getBoundingClientRect();if(window.AlchemyScene2D.takePill({clientX:r.x+r.width/2,clientY:r.y+r.height/2}))document.getElementById('alchemyScene').focus();});
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;fit();});}
  function fit(){
    const mobile=innerWidth<=650,s=window.AlchemyGame.snapshot(),atWork=window.AlchemyViewState.snapshot().current==='work';
    document.body.classList.toggle('info-at-work',atWork);
    document.body.classList.toggle('info-choosing',!!s.runeChoices?.length);
    const top=document.querySelector('.engine-nav').getBoundingClientRect().bottom+8;
    document.body.style.setProperty('--info-top',top+'px');
    for(const el of surfaces){const host=mobile?document.body:stage;if(el.parentElement!==host)host.append(el);el.classList.toggle('mobile-info',mobile);}
    instruction.hidden=!instruction.textContent.trim()||s.roundEnded;
    preview.setAttribute('aria-disabled',String(s.busy||!!s.runeChoices?.length||s.pillEnded));
    if(!mobile||!atWork){document.body.style.setProperty('--work-reserve','0px');return;}
    const odds=document.getElementById('refineOdds'),toggle=document.querySelector('.refine-odds-toggle');
    const oddsTop=!observation.hidden?observation.getBoundingClientRect().bottom+8:top;
    for(const el of [odds,toggle])el.style.top=oddsTop+'px';
    let bottom=top;
    for(const el of [observation,choices,settlement,herbs,odds,toggle])if(el.checkVisibility()&&getComputedStyle(el).display!=='none')bottom=Math.max(bottom,el.getBoundingClientRect().bottom);
    const reserve=Math.min(innerHeight*.5,Math.max(0,bottom-top+16));
    document.body.style.setProperty('--work-reserve',reserve+'px');
  }
  window.addEventListener('alchemy:self-select',()=>{document.body.classList.add('selecting-own');schedule();});
  window.addEventListener('alchemy:order',()=>{document.body.classList.remove('selecting-own');schedule();});
  window.addEventListener('alchemy:view-ready',e=>{const c=window.AlchemyGame.campaign(),s=window.AlchemyGame.snapshot();if(e.detail.view==='work'&&lastView==='shop'&&s.roundEnded&&(c?.economy?.stock?.some(n=>n>0)||Object.values(c?.economy?.herbs||{}).some(n=>n>0)))document.body.classList.add('selecting-own');lastView=e.detail.view;schedule();});
  for(const name of ['alchemy:render','alchemy:interaction','alchemy:view-ready','resize'])window.addEventListener(name,schedule);
  const observer=new ResizeObserver(schedule);[observation,settlement,choices,herbs,document.getElementById('refineOdds'),document.querySelector('.engine-nav')].forEach(el=>observer.observe(el));
  new MutationObserver(schedule).observe(instruction,{childList:true});
  document.addEventListener('toggle',schedule,true);fit();
})();
