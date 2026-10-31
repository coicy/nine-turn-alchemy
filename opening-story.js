(() => {
  'use strict';
  const start=document.getElementById('startButton');
  const scene=document.createElement('section');scene.className='in-scene-prologue';scene.hidden=true;
  scene.setAttribute('aria-label','开场故事');scene.setAttribute('aria-labelledby','prologueTitle');
  scene.innerHTML='<p class="prologue-location" id="prologueLocation"></p><div class="prologue-dialogue"><div class="prologue-copy" aria-live="polite"><span id="prologueStep"></span><h2 id="prologueTitle"></h2><p id="prologueText"></p></div><div class="prologue-actions"><button type="button" id="prologueNext"></button><button type="button" id="prologueSkip">跳过演出</button></div></div>';
  document.body.append(scene);
  const next=scene.querySelector('#prologueNext'),skip=scene.querySelector('#prologueSkip');
  let active=false,finishing=false,index=0,pending=null,cleanup=()=>{};
  let layout,nav,close;
  const shots=[
    ['一张新招牌','你带着一只旧丹炉，在坊市租下临街的小屋。今日，你的丹坊开张了。','丹房 · 开张第一日','去柜台迎客 →','work'],
    ['第一位客人','','接待柜台 · 第一笔生意','携药回炉 →','orders'],
    ['点起第一炉火','三包委托药材已放进备药匣。先取一包投入炉口，这笔生意就从亲手开炉开始。','丹房 · 药材已备齐','亲手开炉 →','work']
  ];
  function request(view,ready){
    cleanup();next.disabled=true;
    scene.dataset.changing='true';
    const complete=()=>{const s=window.AlchemyViewState.snapshot();if(s.current!==view||s.phase!=='idle')return;cleanup();scene.dataset.changing='false';next.disabled=false;ready();};
    window.addEventListener('alchemy:view-ready',complete);
    cleanup=()=>window.removeEventListener('alchemy:view-ready',complete);
    window.dispatchEvent(new CustomEvent('alchemy:opening-view',{detail:{view}}));
    complete();
  }
  function show(){
    const shot=shots[index],order=window.AlchemyGame.snapshot().order;
    document.body.dataset.openingStep=String(index);scene.dataset.shot=String(index);
    scene.querySelector('#prologueLocation').textContent=shot[2];
    scene.querySelector('#prologueTitle').textContent=shot[0];
    scene.querySelector('#prologueStep').textContent=`${index+1} / 3`;
    scene.querySelector('#prologueText').textContent=index===1?`${window.AlchemyCustomers?.profile(order)?.name||order?.client||'客人'}将三包药材放上柜台：“请替我代炼。成丹归我，若未炼成，不必赔药。”`:shot[1];
    next.textContent=shot[3];
    window.AlchemySaves?.setPreference('openingStep',index);
    request(shot[4],()=>next.focus({preventScroll:true}));
  }
  function finish(){
    if(!active||finishing)return;finishing=true;skip.disabled=true;
    request('work',()=>{
      window.AlchemySaves?.setPreference('openingStep',3);
      active=false;finishing=false;scene.hidden=true;
      document.body.classList.remove('opening-in-scene');delete document.body.dataset.openingStep;
      layout.inert=false;nav.inert=false;if(close)close.inert=false;
      window.dispatchEvent(new Event('alchemy:opening-finished'));
      (document.querySelector('.herb-slot[data-slot="0"]')||document.getElementById('alchemyScene')).focus({preventScroll:true});
    });
  }
  function begin(step){
    layout=document.querySelector('.game-layout');nav=document.querySelector('.engine-nav');close=document.querySelector('.engine-close');
    active=true;index=step;scene.hidden=false;skip.disabled=false;
    document.body.classList.add('opening-in-scene');layout.inert=true;nav.inert=true;if(close)close.inert=true;
    show();
  }
  // Initialize the real campaign through its normal start handler, then stage its actual rooms.
  start.addEventListener('click',()=>{
    const step=window.AlchemySaves?.preference('openingStep');
    pending=!start.textContent.includes('继续经营')?0:Number.isInteger(step)&&step>=0&&step<3?step:null;
  },true);
  start.addEventListener('click',()=>{if(pending!==null&&window.AlchemyGame.snapshot().started){const step=pending;pending=null;begin(step);}});
  next.addEventListener('click',()=>{if(finishing||next.disabled)return;if(index<2){index++;show();}else finish();});
  skip.addEventListener('click',finish);
  document.addEventListener('keydown',e=>{
    if(!active)return;
    if(e.key==='Tab'){const buttons=[next,skip].filter(b=>!b.disabled);e.preventDefault();e.stopImmediatePropagation();const at=buttons.indexOf(document.activeElement);buttons[(at+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus({preventScroll:true});return;}
    if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();finish();}
    else if(!scene.contains(e.target)){e.preventDefault();e.stopImmediatePropagation();next.focus({preventScroll:true});}
  },true);
  window.AlchemyOpening={get active(){return active;},snapshot:()=>({active,step:index,finishing})};
})();
