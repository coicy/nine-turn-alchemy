/* === Consolidated source: room-ui.js === */
(() => {
 const api=window.AlchemyGame,UX=window.AlchemyUX,forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');document.body.classList.add('painted-room');forge.dataset.room='true';
 stage.insertAdjacentHTML('beforeend','<section class="room-observation" aria-label="炉中丹药"><h2>炉中丹药</h2><div id="roomFacts"></div><small></small></section><p class="room-empty" id="roomEmpty" hidden></p><section id="roomSettlement" class="room-loop-card" hidden aria-live="polite"></section>');
 const fire=document.getElementById('fireObject');fire.insertAdjacentHTML('afterbegin','<img class="room-tool" src="'+(window.AlchemyWarmProps?.props.fan.src||'assets/runtime/alchemy-fan-v1.webp')+'" alt="" draggable="false">');document.querySelector('.tray-object b').textContent='收丹盘';
 const decision=document.createElement('p');decision.id='roomDecision';const stock=document.createElement('p');stock.id='roomStock';document.querySelector('.room-observation').append(decision,stock);
 let receiptKey='',dismissedReceipt='';
 const receiptId=s=>[s.orderId,s.attempt,s.endReason,s.collected.length].join(':');
 function dismissReceipt(){dismissedReceipt=receiptId(api.snapshot());settlement.hidden=true;}
 const settlement=document.getElementById('roomSettlement');

 settlement.addEventListener('click',e=>{if(e.target.closest('button'))dismissReceipt();if(e.target.closest('[data-furnace-room]')){window.AlchemyFurnaceView.returnToRoom();return;}if(e.target.closest('#settlementReserveStart')){window.AlchemyViewState.navigate('work',{workMode:'room'});window.dispatchEvent(new Event('alchemy:reserve-select'));return;}const b=e.target.closest('[data-destination]');if(b){if(b.dataset.destination==='supply')window.AlchemyMerchantVisit.call();else window.AlchemyViewState.navigate(b.dataset.destination);}});
 function update(){const s=api.snapshot(),c=api.campaign(),E=window.AlchemyEconomy,live=s.started&&!s.pillEnded&&!s.roundEnded;


  const view=window.AlchemyViewState.snapshot(),furnaceEnd=view.workMode==='furnace'&&s.started&&s.pillEnded&&['collect','explode'].includes(s.endReason);
  settlement.hidden=true;
  const key=[receiptId(s),s.roundEnded,c?.economy?.stock.join(','),Object.values(c?.economy?.herbs||{}).join(','),c?.economy?.pills?.length].join(':');
  if(!settlement.hidden&&key!==receiptKey){receiptKey=key;const o=s.order,hasMaterials=c.phase==='open'&&((c.economy.stock||[]).some(n=>n>0)||Object.values(c.economy.herbs||{}).some(n=>n>0)),pending=c.orders.some(o=>o.status==='pending'),success=s.endReason==='collect';
   if(!s.roundEnded){UX.html(settlement,'<header class="receipt-heading"><h2>'+(s.endReason==='collect'?'本炉已收丹':'本炉炸炉')+'</h2><span aria-hidden="true">'+(s.endReason==='collect'?'收':'止')+'</span></header><div class="receipt-details"><p>本单累计 '+Math.round(s.delivered)+' / '+s.target+' · 余客料 '+s.remaining+' 包</p></div><div class="receipt-actions"><button data-furnace-room data-primary data-focus-key="furnace-restock">回丹房取料</button></div>');}
   else {const potency=Number.isFinite(s.grossValue)?s.grossValue:Math.round(s.value+(s.yuanBonus||0));const summary=o?(o.status==='completed'?'委托完成 · 收入 '+(o.reward||0)+' 铜钱'+(o.gifted?' · 赠药 '+o.gifted+' 包':''):'委托结束 · 余料已退'):(success?'丹药已入丹匣 · '+s.turn+'转 · 药力 '+potency:'本炉炸炉 · 未成丹');
   const primary=o?'orders':(hasMaterials?'reserve':success&&c.economy.pills.length?'bag':'supply');
   UX.html(settlement,'<header class="receipt-heading"><h2>'+(o?'委托结契':'本炉凭据')+'</h2><span aria-hidden="true">结</span></header><div class="receipt-details"><p>'+UX.esc(o?window.AlchemyCustomers.settlement(o):summary)+'</p></div>'+'<div class="receipt-actions">'+(pending?'':'<button data-destination="orders">回柜台收工</button>')+'<button id="settlementReserveStart" '+(!hasMaterials?'hidden':'')+' '+(primary==='reserve'?'data-primary':'')+'>使用储备药材</button><button data-destination="bag" '+(!o&&!success?'':'hidden')+' '+(primary==='bag'?'data-primary':'')+'>打开丹匣</button><button data-destination="supply" '+(hasMaterials?'hidden':'')+' '+(primary==='supply'?'data-primary':'')+'>请何采药送药</button></div>');
   const buttons=settlement.querySelector('.receipt-actions');const main=buttons.querySelector('[data-primary]');if(main)buttons.prepend(main);}
  }
  const potency=Number.isFinite(s.grossValue)?s.grossValue:Math.round(s.value+(s.yuanBonus||0));
  decision.textContent=live?(s.order?`交丹后 ${Math.round(s.delivered+potency)} / ${s.target} · ${s.delivered+potency>=s.target?'可结单':'尚差 '+Math.ceil(s.target-s.delivered-potency)}`:'收丹入匣 · 售价估计 '+E.saleValue(c,s)+' 铜钱'):'';
  stock.textContent=live&&s.order?`已交 ${Math.round(s.delivered)} · 本单余料 ${s.remaining} 包`:'';stock.hidden=!stock.textContent;
  document.body.classList.toggle('info-live',live);document.body.classList.toggle('info-ended',s.roundEnded);stage.dataset.live=String(live);stage.dataset.loading=String(!!s.busy);document.querySelector('.room-observation').hidden=!live;
  for(const id of ['herbObject','trayObject','trayPills','deliverySeals','roomEmpty'])document.getElementById(id).hidden=true;fire.hidden=!live;
  const facts=document.getElementById('roomFacts');facts.replaceChildren();if(live)for(const [label,value]of[['转数',s.turn+'转'],['品质',document.getElementById('qualityValue').textContent],['当前药力',potency],['炸丹概率',(api.refinementProbabilities().outcomes.explode*100).toFixed(1)+'%']]){const row=document.createElement('div');row.dataset.fact=label;row.innerHTML='<span>'+label+'</span><strong>'+value+'</strong>';facts.append(row);}
  document.getElementById('fireLabel').textContent=s.busy?'炼化中':'炼化';document.getElementById('fireHint').textContent='点火门扇火';document.getElementById('trayHint').textContent='收入丹匣';document.querySelector('.commission-slip').hidden=live||!s.order||s.roundEnded;document.getElementById('toolTriggerStatus').hidden=true;document.getElementById('valueChange').hidden=true;
 }
 window.addEventListener('alchemy:furnace-leave',dismissReceipt);window.addEventListener('alchemy:view-ready',e=>{if(e.detail.location!=='work'||(e.detail.view!=='work'&&e.detail.workMode!=='furnace'))dismissReceipt();update();});window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:order',update);update();
})();
;
/* === Consolidated source: scene2d.js === */
(() => {
  'use strict';
  const stage=document.getElementById('pillStage'), game=window.AlchemyGame;
  const canvas=document.createElement('canvas');canvas.id='alchemyScene';canvas.width=1600;canvas.height=900;canvas.tabIndex=0;canvas.setAttribute('aria-label','炼丹场景：Tab选择药包或丹药，Enter拿起；进入场景后Enter投炉或落盘。未持物时Enter扇火炼化，Escape放回。');stage.append(canvas);
  document.body.classList.add('canvas-room');
  const ctx=canvas.getContext('2d'),cache=new Map();
  let state=game.snapshot(),dirty=true; const stats={frames:0,drawn:[]};
  window.addEventListener('alchemy:render',()=>{state=game.snapshot();noticeUntil=0;dirty=true;});
  const objects=window.AlchemyWorldLayout.objects, mouth=window.AlchemyWorldLayout.mouth,firebox=window.AlchemyWorldLayout.firebox;
  objects.herbs.src='herb-parcel-v1';
  function carry(){stage.dataset.carry=held||'';window.dispatchEvent(new CustomEvent('alchemy:carry',{detail:{kind:held}}));}
  let fanningUntil=0,fanTimer=null;
  let held=null,pointer=null,hover=null,focusIndex=0,notice='',noticeUntil=0,prepareHerbs=null;
  const live=()=>{const s=state;return s.started&&!s.roundEnded&&!s.pillEnded;};
  const furnace=()=>window.AlchemyViewState?.snapshot().workMode==='furnace';
  function ready(){const s=state,v=window.AlchemyViewState?.snapshot();return !window.AlchemyDialogue?.blocking&&!(v?.reading&&(furnace()||!v.short))&&!fanTimer&&s.started&&!s.busy&&!window.AlchemyInteractionBusy;}
  function image(src){src=window.AlchemyWarmProps?.resolve(src)||src;if(!cache.has(src)){const im=window.AlchemyAssets?.getImage(src)||new Image();const item={im,mask:null};cache.set(src,item);im.onload=()=>{dirty=true;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const k=c.getContext('2d',{willReadFrequently:true});k.drawImage(im,0,0);try{item.mask=k.getImageData(0,0,c.width,c.height);}catch{item.mask=false;}};if(im.complete&&im.naturalWidth)im.onload();else if(window.AlchemyLocalImages?.has(src))window.AlchemyLocalImages.source(src).then(uri=>{im.src=uri;}).catch(()=>{item.mask=false;});else im.src=src;}return cache.get(src);}
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();dirty=true;});
  window.addEventListener('alchemy:pill-art-ready', () => { dirty = true; });
  Object.values(objects).filter(o=>o.src).forEach(o=>image('assets/runtime/'+o.src+'.webp'));
  function available(){const s=state;return !s.order||s.roundEnded?[]:live()?(furnace()?(window.AlchemySceneContinuity?['pill']:['tool','pill']):[]):furnace()&&s.remaining>0?['herbs']:[];}
  function rect(r,p){return p&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
  function hit(kind,p){const o=objects[kind];return rect(o,p);}
  function tell(text){notice=text;noticeUntil=performance.now()+2200;dirty=true;setTimeout(()=>{dirty=true;},2250);window.AlchemyUX.tell(text);}
  function cancel(){held=null;pointer=null;hover=null;prepareHerbs=null;dirty=true;carry();}
  function use(p){if(!held)return;if(!ready()){cancel();return;}const kind=held,before=state,prepare=prepareHerbs,validDrop=rect(kind==='pill'?objects.tray:kind==='herbs'?mouth:firebox,p);cancel();if(kind==='pill'&&validDrop){if(game.collect()){window.AlchemyGameFeel?.emit('dropped',{kind:'pill',tier:'medium'});if(game.snapshot().pillEnded){dirty=true;}}}else if(kind==='herbs'&&validDrop){if(prepare&&!prepare()){window.AlchemyGameFeel?.emit('cancel',{kind:'herbs',reason:'busy',tier:'small'});tell('材料暂不可用，请先处理当前委托');return;}game.load();if(!game.snapshot().pillEnded){window.AlchemyGameFeel?.emit('loaded',{kind:'herbs',tier:'medium'});stage.classList.add('world-pouring');setTimeout(()=>stage.classList.remove('world-pouring'),450);}}else if(kind==='tool'&&validDrop){window.AlchemyUX.clearInstruction();window.AlchemyGameFeel?.emit('refine',{kind:'fan',tier:'medium'});window.dispatchEvent(new Event('alchemy:fanning'));const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:500;fanningUntil=performance.now()+delay;dirty=true;fanTimer=setTimeout(()=>{fanTimer=null;fanningUntil=0;game.refine();dirty=true;},delay);}else {window.AlchemyGameFeel?.emit('cancel',{kind,tier:'small'});tell('物件已放回原处');}}
  window.addEventListener('alchemy:world-layout',()=>{dirty=true;});window.addEventListener('alchemy:pill-surface',()=>{dirty=true;});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!ready())return;canvas.focus({preventScroll:true});const p=point(e);hover=p;dirty=true;if(held){use(p);return;}if(live()&&state.turn<100&&furnace()&&rect(firebox,p)){held='tool';window.AlchemyGameFeel?.emit('picked',{kind:'tool',tier:'small'});use(p);return;}const kind=available().find(k=>hit(k,p));if(!kind)return;held=kind;window.AlchemyGameFeel?.emit('picked',{kind,tier:'small'});carry();pointer={...p,start:p,moved:false,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const p=point(e);hover=p;dirty=true;if(pointer){pointer.moved ||= Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>8;pointer.x=p.x;pointer.y=p.y;}canvas.style.cursor=held?'grabbing':available().some(k=>hit(k,p))?'grab':'default';});
  canvas.addEventListener('pointerup',e=>{if(!pointer)return;const moved=pointer.moved;pointer=null;if(moved)use(point(e));});
  canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(pointer)cancel();});
  canvas.addEventListener('keydown',e=>{if(!['Enter',' ','Escape'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'){cancel();return;}if(e.repeat||!ready())return;if(held){const r=held==='pill'?objects.tray:held==='tool'?firebox:mouth;use({x:r.x+r.w/2,y:r.y+r.h/2});}else if(live()&&state.turn<100&&furnace()){held='tool';use({x:firebox.x+firebox.w/2,y:firebox.y+firebox.h/2});}},true);
  // Prevent the legacy global Enter shortcut from bypassing scene-object use.
  window.addEventListener('alchemy:view-ready',()=>{dirty=true;});window.addEventListener('blur',cancel);window.addEventListener('alchemy:order',()=>{clearTimeout(fanTimer);fanTimer=null;fanningUntil=0;cancel();});window.addEventListener('alchemy:render',()=>{if(held&&!available().includes(held))cancel();});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  function sprite(kind,x,y,w,h,pill=state){stats.drawn.push(kind);const o=objects[kind];if(kind==='pill'){const diameter=Math.min(w,h,objects.pill.visualDiameter||Math.min(w,h));x+=(w-diameter)/2;y+=(h-diameter)/2;const result=window.AlchemyPillArt.draw(ctx,x,y,diameter,pill);if(result.animating)dirty=true;return;}const im=image('assets/runtime/'+o.src+'.webp').im;if(im.complete&&im.naturalWidth){ctx.save();ctx.fillStyle='#36281933';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.85,w*.4,h*.12,0,0,Math.PI*2);ctx.fill();if(kind==='tool'&&furnace()){ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);ctx.drawImage(im,-w/2,-h/2,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();}}
  function label(text,x,y){ctx.font='19px Microsoft YaHei';ctx.textAlign='center';ctx.fillStyle='#f7ead3';const w=ctx.measureText(text).width+28;ctx.fillRect(x-w/2,y-22,w,32);ctx.fillStyle='#503b29';ctx.fillText(text,x,y);}
  function floorExtension(){
    if(!window.AlchemyWorldLayout.mobile||canvas.width<1)return;
    const imageHeight=parseFloat(stage.style.getPropertyValue('--room-base-height')),imageTop=window.AlchemySceneContinuity?parseFloat(stage.style.getPropertyValue('--scene-image-top'))||0:0;
    const base=imageHeight+imageTop,roomWidth=parseFloat(stage.style.getPropertyValue('--room-base-width')),left=parseFloat(stage.style.getPropertyValue('--room-camera-left'));
    if(!Number.isFinite(base)||canvas.height<=base||roomWidth<1)return;
    const near=furnace(),im=window.AlchemyAssets?.getImage(window.AlchemySceneContinuity?.imageFor(near)||(near?'assets/furnace-view/mobile-v2.webp':'assets/workbench/room-mobile.webp'));
    if(!im?.naturalWidth)return;
    const sourceH=near?Math.floor(im.naturalHeight*.14):148,sourceY=near?im.naturalHeight-sourceH:1300,tileH=sourceH*roomWidth/im.naturalWidth;
    // Continue the same scene's unobstructed floor; reflected edges meet without a seam.
    for(let y=base-1,index=0;y<canvas.height;y+=tileH,index++){
      ctx.save();ctx.translate(left,y+(near&&index%2===0?tileH:0));if(near&&index%2===0)ctx.scale(1,-1);
      ctx.drawImage(im,0,sourceY,im.naturalWidth,sourceH,0,0,roomWidth,tileH+1);ctx.restore();
    }
  }
  function restingShadow(r,d,x,y){
    stats.craftShadow=null;
    if(state.craftKind){const c=r.contact;if(!c)return;const m=c.mouth;ctx.save();ctx.beginPath();ctx.ellipse(m.x+m.w/2,m.y+m.h/2,m.w*.47,m.h*.43,0,0,Math.PI*2);ctx.clip();ctx.save();ctx.translate(c.x,c.y+Math.max(2,c.ry*.22));ctx.scale(c.rx*1.25,c.ry*1.45);const bed=ctx.createRadialGradient(0,0,0,0,0,1);bed.addColorStop(0,'#160b0552');bed.addColorStop(.65,'#160b0526');bed.addColorStop(1,'#160b0500');ctx.fillStyle=bed;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();ctx.translate(c.x,c.y);ctx.scale(c.rx,c.ry);const gradient=ctx.createRadialGradient(0,0,0,0,0,1);gradient.addColorStop(0,'#120904b8');gradient.addColorStop(.52,'#160b056e');gradient.addColorStop(1,'#160b0500');ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(0,0,1,0,Math.PI*2);ctx.fill();ctx.restore();stats.craftShadow={...c,clippedToMouth:true};return;}
    ctx.save();ctx.fillStyle='#21170daa';ctx.beginPath();ctx.ellipse(x+d*.55,y+d*.91,d*.4,d*.1,0,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function draw(t){requestAnimationFrame(draw);if(document.hidden||(!dirty&&t>noticeUntil))return;dirty=false;stats.frames++;stats.drawn=[];stats.craftShadow=null;ctx.clearRect(0,0,canvas.width,canvas.height);floorExtension();const s=state;const list=available();/* Resting fan is absent from the approved scene; transient fanning still follows real actions. */if(!window.AlchemySceneContinuity&&held!=='tool'&&(t>fanningUntil||matchMedia('(prefers-reduced-motion: reduce)').matches||window.AlchemyGameFeel?.reduced))sprite('tool',objects.tool.x,objects.tool.y,objects.tool.w,objects.tool.h);
    if((furnace()||window.AlchemySceneContinuity)&&live()&&!held&&!s.busy&&t>=fanningUntil){const r=objects.pill,d=r.visualDiameter||r.w,x=r.x+(r.w-d)/2,y=r.y+(r.h-d)/2;restingShadow(r,d,x,y);sprite('pill',r.x,r.y,r.w,r.h);}
    if(!window.AlchemySceneContinuity&&furnace()&&s.pillEnded&&s.endReason==='collect'){const r=objects.tray,p=objects.pill;const size=Math.min(p.w,r.w*.65),x=r.x+(r.w-size)/2,y=r.y+(r.h-size)/2;ctx.save();ctx.fillStyle='#21170d66';ctx.beginPath();ctx.ellipse(x+size*.5,y+size*.9,size*.38,size*.08,0,0,Math.PI*2);ctx.fill();ctx.restore();sprite('pill',x,y,size,size,s);}
    for(const kind of list){if(held===kind){const o=objects[kind];ctx.clearRect(o.x,o.y,o.w,o.h);if(hover){ctx.save();ctx.globalAlpha=.95;sprite(kind,hover.x-o.w/2,hover.y-o.h/2,o.w,o.h);ctx.restore();}}}
    if(fanningUntil>t&&!matchMedia('(prefers-reduced-motion: reduce)').matches&&!window.AlchemyGameFeel?.reduced){dirty=true;const r=firebox;ctx.save();ctx.translate(r.x+r.w*1.2,r.y+r.h*.65);ctx.rotate(-.65+Math.sin(t/85)*.42);const fan=image('assets/runtime/alchemy-fan-v1.webp').im;if(fan.complete&&fan.naturalWidth)ctx.drawImage(fan,-r.w*.3,-r.h*.8,r.w*.6,r.h*.9);ctx.restore();}
    if(held&&!window.AlchemyFurnaceGuidance){const target=held==='pill'?objects.tray:held==='tool'?firebox:mouth;ctx.save();ctx.strokeStyle=rect(target,hover)?'#709653':'#a65b36';ctx.lineWidth=4;ctx.setLineDash([12,8]);ctx.strokeRect(target.x,target.y,target.w,target.h);ctx.restore();label(rect(target,hover)?'松手使用':'放到这里',target.x+target.w/2,target.y-12);}else if(!held&&hover&&!window.AlchemyFurnaceGuidance){const k=list.find(k=>hit(k,hover));if(k)label({herbs:'从药柜取药包，投入炉口',tool:'拿起扇子，对火门扇风',pill:'从炉口取丹，放入收丹盘'}[k],hover.x,hover.y-30);}
    if(t>noticeUntil){const el=document.getElementById('workInstruction');const next=window.AlchemyUX.instruction(s,held);if(el.textContent!==next)el.textContent=next;el.hidden=!next;}}
  requestAnimationFrame(draw);
  window.AlchemyScene2D={refine:()=>{if(!ready()||!live()||!furnace()||held||state.turn>=100)return false;held='tool';use({x:firebox.x+firebox.w/2,y:firebox.y+firebox.h/2});return true;},collectHeld:()=>{if(held!=='pill')return false;use({x:objects.tray.x+objects.tray.w/2,y:objects.tray.y+objects.tray.h/2});return true;},takeHerbs:(e,prepare)=>{if(!ready()||!furnace()||live()||(!prepare&&(!state.order||state.roundEnded||state.remaining<=0)))return false;held='herbs';prepareHerbs=prepare||null;hover=point(e);dirty=true;carry();return true;},moveHerbs:e=>{hover=point(e);dirty=true;},dropHerbs:e=>use(point(e)),stats,get busy(){return !!fanTimer;},get held(){return held;},objects,mouth,firebox,cancel,takePill:e=>{if(held||!ready()||!live()||!furnace())return false;held='pill';hover=point(e);dirty=true;carry();return true;},movePill:e=>{hover=point(e);dirty=true;},dropPill:e=>use(point(e))};
  window.AlchemyWorldLayout.fit();
})();
;
/* === Consolidated source: scene-feedback.js === */
(() => {
  'use strict';
  const stage=document.getElementById('pillStage');
  stage.insertAdjacentHTML('beforeend','<div id="fireResponse" aria-hidden="true"></div><div id="refineFeedback" class="refine-feedback" role="status" hidden><strong></strong><p></p><small></small></div>');
  const box=document.getElementById('refineFeedback'),fire=document.getElementById('fireResponse');
  const sound=document.createElement('button');sound.type='button';sound.className='scene-sound';sound.setAttribute('aria-label','切换游戏音效');
  document.querySelector('.engine-nav').append(sound);
  let muted=false;try{muted=localStorage.getItem('alchemy.sound')==='off';}catch{}
  let audio=null,noise=null,timer,pulseTimer;
  function soundLabel(){sound.textContent=muted?'音效：关':'音效：开';sound.setAttribute('aria-pressed',String(!muted));}
  soundLabel();
  function unlock(){if(muted)return;try{if(!audio){audio=new (window.AudioContext||window.webkitAudioContext)();noise=audio.createBuffer(1,audio.sampleRate*.35,audio.sampleRate);const d=noise.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(audio.state==='suspended')void audio.resume().catch(()=>{});}catch{}}
  document.addEventListener('pointerdown',unlock,{capture:true});document.addEventListener('keydown',unlock,{capture:true});
  sound.onclick=()=>{muted=!muted;try{localStorage.setItem('alchemy.sound',muted?'off':'on');}catch{}soundLabel();if(muted)void audio?.suspend();else unlock();};
  function tone(frequency,duration,delay=0,volume=.07){if(muted||!audio||audio.state!=='running')return;const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.setValueAtTime(frequency,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+duration);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+duration+.01);}
  function rush(delay=0,duration=.16,frequency=650,volume=.12){if(muted||!audio||audio.state!=='running')return;const t=audio.currentTime+delay,s=audio.createBufferSource(),f=audio.createBiquadFilter(),g=audio.createGain();s.buffer=noise;f.type='lowpass';f.frequency.value=frequency;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.035);g.gain.exponentialRampToValueAtTime(.0001,t+duration);s.connect(f);f.connect(g);g.connect(audio.destination);s.start(t);s.stop(t+duration);}
  function pulse(kind){if(matchMedia('(prefers-reduced-motion: reduce)').matches||window.AlchemyGameFeel?.reduced)return;clearTimeout(pulseTimer);fire.className='';void fire.offsetWidth;fire.className=kind;pulseTimer=setTimeout(()=>{fire.className='';},650);}
  box.classList.add('furnace-hint');
  document.querySelector('.engine-viewport').append(box);
  let guide = '', ritualGuide = '', result = null;
  const titleNode=box.querySelector('strong'), messageNode=box.querySelector('p'), deltaNode=box.querySelector('small');
  function renderGuide() {
    const view=window.AlchemyViewState?.snapshot();
    const ritualText=view?.current==='work' && view.workMode==='furnace' ? ritualGuide : '';
    const entry=ritualText ? {title:'敕火符',message:ritualText,delta:'',kind:'neutral'} :
      result || (guide ? {title:'',message:guide,delta:'',kind:'neutral'} : null);
    // Targets name these actions already; retain their accessible description.
    // Results, ritual steps and nonredundant guidance still use the visible strip.
    box.dataset.presentation=!ritualText&&!result&&['点火门催炼','收丹入匣','收取入匣'].includes(guide)?'assistive':'visible';
    box.hidden=!entry;
    if (!entry) return;
    for(const [node,value] of [[titleNode,entry.title],[messageNode,entry.message],[deltaNode,entry.delta]]) {
      if(node.textContent!==value) node.textContent=value;
    }
    box.dataset.kind=entry.kind;
  }
  function clearResult() {
    clearTimeout(timer);
    result=null;
    renderGuide();
  }
  function show(title,message,delta,kind='neutral',duration=1800) {
    clearTimeout(timer);
    result={title,message,delta:delta||'',kind};
    renderGuide();
    timer=setTimeout(clearResult,duration);
  }
  window.addEventListener('alchemy:fanning',()=>{clearResult();unlock();pulse('fanning');rush(0);rush(.23);});
  const names={resume:'回炉续炼',big:'大成功',success:'炼化成功',hold:'火候维持',damage:'丹体受损',explode:'炸炉 · 本炉结束',complete:'百转成丹',collect:'收丹完成',submit:'已交丹',win:'委托完成',loss:'本单结束'};
  window.addEventListener('alchemy:feedback',e=>{const d=e.detail,k=d.event;if(k==='start'){if(window.AlchemyGame.snapshot().pillEnded){clearResult();return;}pulse('loaded');tone(180,.13);return;}if(k==='ritual-complete'){show('敕火符已成',d.message,'','good',1800);tone(392,.17);tone(588,.25,.08);return;}if(!names[k])return;if(['collect','win','loss'].includes(k)&&window.AlchemyGame.snapshot().roundEnded){clearResult();tone(740,.24);return;}const bad=['explode','damage','loss'].includes(k),good=['success','big','complete','win'].includes(k);const craft=!!window.AlchemyGame.snapshot().craftKind,label=craft?'估值':'药力';const value=typeof d.value==='number'?(d.value===0?label+'未变':`${label} ${d.value>0?'+':'−'}${Math.round(Math.abs(d.value))}`):String(d.value||'');show(craft?({damage:'造物受损',explode:'炸炉 · 本炉结束',complete:'百转造物',collect:'收取完成'}[k]||names[k]):names[k],d.autoStep ? `符火护炉 · 自动连炼 ${d.autoStep} / ${d.autoTotal || 5}` : '',value,bad?'bad':good?'good':'neutral',1800);pulse(bad?'damaged':'result');
    if(k==='explode'){rush(0,.25,220,.2);tone(90,.28);}else if(bad){rush(0,.12,420,.09);tone(155,.14,0,.045);}else if(k==='hold'){tone(240,.2,.02,.045);}else if(['collect','win'].includes(k)){tone(740,.24);tone(990,.3,.08);}else if(['big','fusion','complete'].includes(k)){tone(392,.24,0,.08);tone(588,.3,.045,.065);tone(784,.38,.10,.055);}else{tone(520,.14,0,.045);tone(780,.18,.055,.035);}
  });
  window.addEventListener('alchemy:feel',e=>{
    const d=e.detail||{};
    if(d.event==='yuan'){unlock();tone(330,.22,0,.055);tone(660,.32,.08,.05);}
    else if(d.event==='protection'){unlock();tone(260,.18,0,.045);tone(520,.28,.08,.04);}
    else if(d.event==='ritual-start'){unlock();tone(180,.24,0,.04);}
    else if(d.event==='ritual-sealed'){unlock();tone(392,.18,0,.05);tone(784,.32,.08,.045);}
    else if(d.event==='stroke'){unlock();tone(520,.07,0,.025);}
    else if(['purchase','equipment'].includes(d.event)){unlock();tone(460,.12,0,.035);}
    else if(['paid','rent-paid'].includes(d.event)){unlock();tone(620,.15,0,.04);tone(840,.22,.06,.035);}
  });
  window.addEventListener('alchemy:view-ready',clearResult);
  window.addEventListener('alchemy:order',()=>{clearResult();fire.className='';});
  window.addEventListener('alchemy:carry',e=>{if(e.detail.kind)clearResult();});
  window.AlchemyFeedback={
    setGuide(text){if(text!==guide){guide=text;renderGuide();}},
    setRitualGuide(text){if(text!==ritualGuide){ritualGuide=text;renderGuide();}},
    get muted(){return muted;},get audioState(){return audio?.state||'locked';}};
})();
;
/* === Consolidated source: refine-animation.js === */
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
  const painted = document.body.classList.contains('warm-cinnabar-experiment');
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
    if(window.AlchemyRefinePerformance?.owns(kind))return;
    if (reduced.matches || window.AlchemyGameFeel?.reduced || AlchemyViewState.snapshot().current !== 'work') return;
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
    if(painted){
      ctx.globalAlpha=alpha*.45;ctx.fillStyle=color;
      ctx.beginPath();ctx.moveTo(-1,.2);ctx.bezierCurveTo(-.8,-.5,.2,-.8,.8,-.2);ctx.bezierCurveTo(1,.1,.6,.5,-.2,.5);ctx.closePath();ctx.fill();ctx.restore();return;
    }
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'transparent');
    ctx.globalAlpha = alpha;
    ctx.fillStyle = gradient;
    ctx.fillRect(-1, -1, 2, 2);
    ctx.restore();
  }

  function flecks(x, y, radius, progress, count, color, falling = false) {
    if(painted)count=Math.ceil(count*.55);
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
    if (document.hidden || window.AlchemyGameFeel?.reduced) { stop(); return; }
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
      if (!window.AlchemyFurnaceFire) fire(progress,layout);
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
;
/* === Consolidated source: observation-near.js === */
(() => {
  const card=document.querySelector('.room-observation'),source=document.getElementById('pillVisual');
  card.querySelector('h2').textContent='观丹 · 炉内映像';
  const preview=document.createElement('div');preview.className='observation-pill layered-game-pill';preview.setAttribute('aria-hidden','true');card.querySelector('h2').after(preview);
  let key='';
  function sync(){const s=window.AlchemyGame.snapshot();card.dataset.busy=String(s.busy);const art=source.querySelector('.layered-pill-art');if(!art)return;const next=art.outerHTML;if(next!==key){key=next;preview.replaceChildren(art.cloneNode(true));}}
  new MutationObserver(sync).observe(source,{childList:true});
  window.addEventListener('alchemy:render',sync);window.addEventListener('alchemy:assets-ready',sync);sync();
})();
;
/* === Consolidated source: herb-tray.js === */
(() => {
  const warm=document.body.classList.contains('warm-cinnabar-experiment');
  const stage=document.getElementById('pillStage'),api=window.AlchemyGame;
  const panel=document.createElement('aside');panel.className='herb-tray';panel.setAttribute('aria-label','药匣槽');stage.append(panel);
  const content=document.createElement('div');content.className='herb-materials';panel.append(content);let rows=[],drag=null;
  const atFurnace=()=>window.AlchemyViewState.snapshot().workMode==='furnace';
  function render(){if(drag||window.AlchemyScene2D?.held==='herbs')return;const s=api.snapshot(),c=api.campaign(),e=c?.economy;if(!e){panel.hidden=true;return;}panel.hidden=false;
    rows=[];if(s.order&&!s.roundEnded)rows.push({name:s.order.name,count:s.remaining,source:'本单供料',current:true});
    ['普通药包','精选药包'].forEach((name,i)=>rows.push({name,count:e.stock[i],source:'储备药包',kind:'reservePack',id:i}));
    [['neutral','平性余药'],['warm','温性余药'],['cool','寒性余药']].forEach(([id,name])=>{if(e.herbs[id])rows.push({name,count:e.herbs[id],source:'委托余药',kind:'reserveHerb',id});});
    for(const d of window.AlchemyCrafts.defs)if(e.craftStock?.[d.id])rows.push({name:d.material,count:e.craftStock[d.id],source:'自购器料',kind:'useCraft',id:d.id});
    rows=rows.filter(r=>r.count>0);const columns=Math.max(1,Math.ceil(rows.length/2));panel.style.setProperty('--herb-columns',columns);panel.style.width=Math.max(190,columns*83+31)+'px';
    window.AlchemyUX.html(content,'<h2>备药匣</h2><div class="herb-slots">'+[...rows,...Array.from({length:Math.max(0,columns*2-rows.length)},()=>({name:'空格',count:0,source:'',vacant:true}))].map((r,i)=>`<div class="herb-slot tier-${r.current?0:r.kind==='reservePack'?r.id:0}" ${r.vacant?'':`data-slot="${i}"`} title="${r.name} · ${r.source} · ${r.count}份" data-empty="${r.count===0}" aria-disabled="${!atFurnace()||!r.count||!s.pillEnded||s.busy||(!r.current&&!!s.order&&!s.roundEnded)}" ${r.vacant?'aria-hidden="true"':'tabindex="0" role="button"'} aria-label="${r.name}，${r.source}，${r.count}份"><img src="${window.AlchemyWarmProps?.props.parcel.src||'assets/runtime/herb-parcel-v1.webp'}" alt="" draggable="false">${warm&&r.current?'<i class="warm-task-material" aria-hidden="true">!</i>':''}<i class="parcel-seal">${r.current?'客':r.kind==='reservePack'?['普','精','灵'][r.id]:r.kind==='useCraft'?'器':'余'}</i><span><b>${r.name}</b><small>${r.source}</small></span><em class="world-herb-source">${r.vacant?'':r.current?'本单':r.kind==='reservePack'?'储备':r.kind==='useCraft'?'器料':'余药'}</em><strong>${r.count?`${r.count}`:''}</strong></div>`).join('')+'</div>'+(warm&&!rows.length?'<p class="warm-stock-empty">暂无原料</p>':'')+'<p id="herbTrayHint" role="status">'+''+'</p>');
  }
  function take(index,e){const r=rows[index],s=api.snapshot();if(!atFurnace()){window.AlchemyUX.tell('先点丹炉进入炉前，再取药投炉。');return false;}if(!r||!r.count){window.AlchemyUX.tell('这里没有可用药材。');return false;}if(s.busy||window.AlchemyInteractionBusy){window.AlchemyUX.tell('正在炼化，请待结果落定。');return false;}if(!s.pillEnded){window.AlchemyUX.tell('炉内有丹，先收丹再取药。');return false;}if(!r.current&&s.order&&!s.roundEnded){window.AlchemyUX.tell('先结清当前委托，再取储备药材。');return false;}const ok=window.AlchemyScene2D.takeHerbs(e,r.current?null:()=>api.economyAction(r.kind,r.id,'neutral'));if(ok){window.AlchemyGameFeel?.emit('picked',{kind:'herbs',source:r.source,tier:'small'});window.AlchemyUX.tell(r.name+' · '+r.source+' · '+(r.kind==='reservePack'?['基础起炉','至少良品'][r.id]:'投入炉口'));}if(ok)panel.querySelector('[data-slot="'+index+'"]')?.classList.add('is-held');return ok;}
  panel.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-slot]');if(!el||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};el.setPointerCapture(e.pointerId);if(!take(Number(el.dataset.slot),e)){drag=null;return;}e.preventDefault();});
  panel.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;window.AlchemyScene2D.moveHerbs(e);});
  panel.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)window.AlchemyScene2D.dropHerbs(e);render();});
  panel.addEventListener('pointercancel',()=>{drag=null;window.AlchemyScene2D.cancel();render();});
  panel.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const el=e.target.closest('[data-slot]');if(!el)return;e.preventDefault();e.stopPropagation();const r=el.getBoundingClientRect();if(take(Number(el.dataset.slot),{clientX:r.x+r.width/2,clientY:r.y+r.height/2}))document.getElementById('alchemyScene').focus();});
  window.addEventListener('alchemy:carry',e=>{if(!e.detail.kind)requestAnimationFrame(render);});
  window.addEventListener('alchemy:reserve-select',()=>{render();const target=panel.querySelector('[data-slot]');if(!target)return;panel.dataset.selectReserve='true';window.AlchemyUX.tell('选一份储备药材投入炉口。');target.focus({preventScroll:true});});
  window.addEventListener('alchemy:view-ready',render);window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:order',()=>{delete panel.dataset.selectReserve;render();});render();
})();
;
/* === Consolidated source: market-merchants.js === */
/* Stock and appointments live in the campaign so a resumed day keeps its visitors and prices. */
(() => {
  'use strict';
  const merchants = {
    artificer: {name:'法器商', portrait:'assets/scene-props/merchant.webp'},
    trader: {name:'周掌柜', portrait:'assets/warm-cinnabar/merchant.webp',fromDay:2,
      pack:()=>sample(window.AlchemyCrafts.defs.map(d=>d.id),2).map(id=>item('craftMaterial',id))},
    herbalist: {name:'何采药', portrait:'assets/warm-cinnabar/herbalist.webp',fromDay:2,
      pack:()=>[item('material',1),item('material',0)]}
  };
  const closed = c => c.orders.filter(o => ['completed','failed'].includes(o.status)).length;
  const item = (kind,id) => ({kind,id});
  const tools = ids => ids.map(id => item('tool',id));
  const firstTools = ['ward','seal','stone','lucky'];
  const maxVisitingTools = 5;
  function firstVisit(phase) {
    return {seller:'artificer',source:'first',phase,goods:tools(firstTools),selected:0};
  }
  function sample(ids,limit) {
    const pool = [...ids], result = [];
    while (pool.length && result.length < limit) result.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    return result;
  }
  function extraTools(c,existing) {
    const eligible=window.AlchemyEconomy.TOOL_DEFS.filter(t=>t.day<=c.day && !c.economy.tools.includes(t.id) && !existing.includes(t.id));
    const extra=window.AlchemyEconomy.hasTool(c.economy.equipped,'stock_talisman')?1:0;
    return sample(eligible.map(t=>t.id),maxVisitingTools+extra-existing.length);
  }
  // Top up an older, already rolled visit once. Keep the selected object, including a furnace plan.
  function expandSavedVisit(c,offer) {
    if (offer?.seller!=='artificer' || offer.source==='held' || ['bought','equip'].includes(offer.phase)) return;
    const goods=offer.goods, existing=goods.filter(g=>g.kind==='tool').map(g=>g.id);
    const selected=goods[offer.selected], upgrade=goods.findIndex(g=>g.kind==='furnace');
    const added=offer.source==='first'?firstTools.filter(id=>!existing.includes(id)):extraTools(c,existing);
    goods.splice(upgrade<0?goods.length:upgrade,0,...tools(added));
    if (selected) offer.selected=goods.indexOf(selected);
  }
  function ensure(c,legacy) {
    if (!c.sellers) {
      const phase = legacy?.phase;
      c.sellers = {day:0, stockVersion:2, introduced:['market','equip','done'].includes(phase), nextTools:0};
      if (['counter','market','equip'].includes(phase)) {
        c.sellers.day = c.day;
        const received=phase==='market' && c.economy.tools.includes('ward') && !c.economy.equipped.length;
        c.sellers.active = firstVisit(phase === 'counter' ? 'greet' : phase === 'equip' ? 'equip' : received ? 'bought' : 'goods');
        c.sellers.nextTools = c.day+2;
      }
    }
    const s = c.sellers;
    if (c.phase !== 'open') { s.active=null; s.held=null; s.plan=null; return s; }
    if (!s.stockVersion) {
      if (s.day===c.day) { expandSavedVisit(c,s.active); expandSavedVisit(c,s.plan); }
      s.stockVersion=2;
    }
    if (s.day === c.day) return s;
    s.day=c.day; s.active=null; s.held=null; s.plan=null;
    if (c.day === 1 || !s.introduced) return s;
    let seller, goods;
    if (c.day >= (s.nextTools || 3)) {
      seller='artificer';
      goods=tools(extraTools(c,[]));
      if (c.economy.furnace<2) goods.push(item('furnace','upgrade'));
      s.nextTools=c.day+2+Math.floor(Math.random()*2);
    } else {
      const eligible=Object.keys(merchants).filter(id=>merchants[id].pack && c.day>=merchants[id].fromDay);
      const others=eligible.filter(id=>id!==s.lastOther);
      const pool=others.length?others:eligible;
      if (!pool.length) return s;
      seller=pool[Math.floor(Math.random()*pool.length)];
      s.lastOther=seller;
      goods=merchants[seller].pack(c);
    }
    if (goods.length) s.plan={after:1+Math.floor(Math.random()*3),seller,goods};
    return s;
  }
  function ready(c) {
    const s=c.sellers;
    if (!s || s.active || c.activeId || c.phase!=='open') return false;
    if (!s.introduced) return closed(c)+c.history.reduce((n,d)=>n+(d.completed||0)+(d.failed||0),0)>=2;
    return !!s.plan && closed(c)>=s.plan.after;
  }
  function change(c,action,index) {
    const s=c.sellers,a=s.active;
    if (c.phase!=='open') return false;
    if (action==='arrive' && ready(c)) {
      if (!s.introduced) {
        s.active=firstVisit('greet'); s.nextTools=c.day+2+Math.floor(Math.random()*2);
      } else {
        s.active={seller:s.plan.seller,goods:s.plan.goods,source:'visit',phase:'goods',selected:0}; s.plan=null;
      }
    } else if (action==='call' && !a && c.economy.stock[0]<=1) {
      s.active={seller:'herbalist',source:'delivery',phase:'goods',goods:[item('material',0)],selected:0};
    } else if (action==='recall' && !a && s.held) {
      s.active={seller:'artificer',source:'held',phase:'goods',goods:[s.held],selected:0};
    } else if (action==='show' && a?.phase==='greet') {
      s.introduced=true; a.phase='goods';
    } else if (action==='select' && a?.phase==='goods' && Number.isInteger(index) && a.goods[index]) {
      a.selected=index;
    } else if (action==='hold' && a?.source==='first' && a.phase==='goods' && !c.economy.tools.includes(a.goods[a.selected].id)) {
      s.held=a.goods[a.selected]; s.active=null; s.introduced=true;
    } else if (action==='equip' && a?.phase==='bought') {
      a.phase='equip';
    } else if (action==='leave' && a) {
      if (a.source==='first') s.introduced=true;
      s.active=null;
    } else return false;
    return true;
  }
  function offered(c,kind,id) {
    const a=c.sellers?.active,good=a?.goods[a.selected];
    return c.phase==='open' && a?.phase==='goods' && good?.kind===kind && (kind==='furnace'||good.id===id);
  }
  function price(c,kind,id,base) {
    const a=c.sellers?.active;
    return kind==='material' && id===1 && a?.seller==='herbalist' && a.source==='visit' ? base-6 : base;
  }
  function bought(c,kind,id) {
    const s=c.sellers,a=s?.active;
    if (kind!=='tool'||!a) return;
    if (s.held?.id===id) s.held=null;
    if (['held','first'].includes(a.source)) {a.phase='bought'; s.introduced=true;}
  }
  window.AlchemyCounterTrade={merchants,ensure,ready,change,offered,price,bought};
})();

/* === Merged from warm-cinnabar-visitors.js (warm-cinnabar merchant portraits) === */
(() => {
  'use strict';
  if (typeof document === 'undefined' || !document.body?.classList?.contains('warm-cinnabar-experiment')) return;
  const merchants=window.AlchemyCounterTrade.merchants;
  for (const [id,file] of Object.entries({artificer:'artificer',trader:'merchant',herbalist:'herbalist'})) {
    merchants[id].portrait='assets/warm-cinnabar/'+file+'.webp';
  }
})();
;
/* === Consolidated source: market-scene.js === */
/* Merchandise sits on the player's reception counter, above the same painted desk as commissions. */
(() => {
  'use strict';
  const api=window.AlchemyGame, trade=window.AlchemyCounterTrade, E=window.AlchemyEconomy, UX=window.AlchemyUX;
  const board=document.querySelector('.counter-board');
  const sale=document.createElement('section');
  sale.id='counterSale'; sale.hidden=true; sale.setAttribute('aria-label','柜台选货');
  sale.innerHTML='<div class="sale-stage"><img class="sale-person" alt=""><div class="sale-desk"></div><header><strong></strong><button type="button" data-sale-leave>下次再看</button></header><div class="sale-wares" role="group" aria-label="柜上的货物"></div></div><div class="sale-slip"><div class="sale-description" id="counterSaleDetail"><button class="sale-use" data-sale-use hidden></button><div class="sale-facts" aria-live="polite" aria-atomic="true"></div></div><footer><div class="sale-account"><span class="sale-wallet"></span><span class="sale-status" role="status"></span></div><button type="button" data-sale-hold>留到收市</button><button type="button" data-sale-buy></button></footer></div>';
  board.append(sale);
  const stage=sale.querySelector('.sale-stage'), person=sale.querySelector('img'), wares=sale.querySelector('.sale-wares');
  const hold=sale.querySelector('[data-sale-hold]'),buy=sale.querySelector('[data-sale-buy]'),leave=sale.querySelector('[data-sale-leave]');
  const parcel='<img class="sale-parcel" src="'+(window.AlchemyWarmProps?.props.parcel.src||'assets/runtime/herb-parcel-v1.webp')+'" alt="">';
  const detail=sale.querySelector('.sale-description');
  const facts=detail.querySelector('.sale-facts'), useButton=detail.querySelector('[data-sale-use]');
  const framed=g=>g.kind==='tool'||g.kind==='furnace';
  function wareButton(g,d,i,selected) {
    const name=UX.esc(d.name);
    const tag=framed(g)?'':'<span class="sale-tag"><b>'+name+'</b><small>'+(d.disabled?d.status:d.price+' 文')+'</small></span>';
    const label=framed(g)?' aria-label="'+name+'"':'';
    return '<button type="button" data-sale-item="'+i+'" data-focus-key="sale-'+i+'" data-object="'+UX.esc(g.id)+'" data-type="'+UX.esc(g.kind)+'"'+label+' aria-controls="counterSaleDetail" aria-pressed="'+(i===selected)+'"><span class="sale-object">'+d.art+'</span>'+tag+'</button>';
  }
  function describe(c,g) {
    const e=c.economy;
    if (g.kind==='tool') {
      const d=E.TOOL_DEFS.find(t=>t.id===g.id),owned=e.tools.includes(g.id);
      return {name:d.name,price:d.price,description:d.description,status:owned?'已持有':'',disabled:owned,art:'<img class="sale-tool" src="'+(window.AlchemyWarmProps?.tools[d.id]?.src||'assets/counter-tools/'+d.id+'.webp')+'" alt="" draggable="false">'};
    }
    if (g.kind==='craftMaterial') {
      const d=window.AlchemyCrafts.get(g.id);
      const scaled=E.hasTool(e.equipped,'material_scale');
      const unitPrice=Math.max(1,Math.round(trade.price(c,g.kind,g.id,d.price*(scaled?.85:1))));
      return {name:d.material,price:unitPrice,status:'库存 '+e.craftStock[g.id]+' 份',disabled:e.craftStock[g.id]>=999,description:'一份炼一件'+d.name+'，炸炉损失器料。'+(scaled?'（工料秤85折，原价'+d.price+'文）':''),art:UX.art({craftKind:g.id,turn:1})+parcel};
    }
    if (g.kind==='furnace') {
      return {name:'改炉图样',price:E.UPGRADES[e.furnace+1],status:['原炉胆','护胆已改','改良完成'][e.furnace],disabled:e.furnace>=2,description:['改良炉胆，每炉首次受损时，药力损失减半。','改良凝丹部件，受损时保住当前转数，药力损失减半。','两道改炉工序都已完成。'][e.furnace],art:'<img class="sale-tool stove-upgrade-plan" src="assets/warm-cinnabar/props/stove-upgrade-plan.webp" alt="" draggable="false">'};
    }
    const fine=g.id===1;
    return {name:fine?'精选药包':'普通药包',price:trade.price(c,g.kind,g.id,E.PRICES[g.id]),status:'库存 '+e.stock[g.id]+' 包',description:fine?'起炉至少良品。这趟随身带的货，便宜六文。':'一包可自炼一炉。',art:parcel+'<i class="sale-seal">'+(fine?'精':'普')+'</i>'};
  }
  function fit() {
    const w=stage.clientWidth,h=stage.clientHeight;
    if (!w||!h) return;
    const experimental=document.body.classList.contains('warm-cinnabar-experiment');
    const scale=experimental?Math.max(w/1600,h/900):Math.max(w/1672,h/941);
    const edge=experimental?(h-900*scale)/2+614*scale:(h-941*scale)/2+523*scale;
    const count=wares.children.length, depth=h-edge;
    const twoRows=count>=4 && w<=650 && (w<count*84+24 || depth>=170);
    const rowPadding=wares.classList.contains('sale-objects-only')?14:42;
    const tabletopSpan=144*scale;
    const size=experimental&&twoRows?Math.min(64,w/(count===4?2:3)*.64,(tabletopSpan-4)/2-(wares.classList.contains('sale-objects-only')?4:18)):twoRows?Math.min(94,w/(count===4?2:3)*.76,(depth-18)/2-rowPadding):Math.min(104,w/(count+1)*.77,h*.22);
    wares.dataset.count=String(count);
    wares.classList.toggle('sale-two-rows',twoRows);
    stage.style.setProperty('--desk-edge',edge+'px');
    stage.style.setProperty('--sale-scale',scale+'px');
    stage.style.setProperty('--size',Math.max(28,Math.round(size))+'px');
  }
  new ResizeObserver(fit).observe(stage);
  function render() {
    const c=api.campaign(),a=c?.sellers?.active;
    const visible=a && ['goods','bought'].includes(a.phase);
    sale.hidden=!visible; board.classList.toggle('selling-goods',!!visible);
    if (!visible) sale.querySelector('.sale-status').textContent='';
    if (!visible) return;
    const seller=trade.merchants[a.seller], goods=a.goods.map(g=>describe(c,g)),g=a.goods[a.selected],d=goods[a.selected];
    person.src=seller.portrait;
    stage.querySelector('header strong').textContent=seller.name+(a.source==='held'?' · 今日留货':a.source==='delivery'?' · 送药':'');
    wares.classList.toggle('sale-objects-only',a.goods.every(framed));
    UX.html(wares,goods.map((d,i)=>wareButton(a.goods[i],d,i,a.selected)).join(''));
    const use=g.kind==='tool' && c.economy.tools.includes(g.id) ? '回炉布置' : g.kind==='craftMaterial' && c.economy.craftStock[g.id] ? '回丹房取料' : '';
    const displayPrice=framed(g) && Number.isFinite(d.price);
    const price=displayPrice?'<strong class="sale-price">'+d.price+' 文</strong>':'';
    detail.classList.toggle('sale-framed-detail',framed(g));
    useButton.hidden=!use; useButton.textContent=use;
    const info='<header><h3>'+d.name+'</h3>'+price+(d.status?'<span>'+d.status+'</span>':'')+'</header><p>'+d.description+'</p>';
    if (facts.innerHTML!==info) facts.innerHTML=info;
    sale.querySelector('.sale-wallet').textContent='现有 '+c.economy.coins+' 文';
    hold.hidden=a.source!=='first'||g.kind!=='tool'||d.disabled;
    const short=Math.max(0,(d.price||0)-c.economy.coins);
    buy.disabled=!!(d.disabled||short);
    const purchase=g.kind==='furnace'?'改炉':'买下';
    buy.textContent=d.disabled?d.status:short?'还差 '+short+' 文':displayPrice?purchase:purchase+' · '+d.price+' 文';
    leave.textContent=a.source==='delivery'?'收起药单':a.source==='held'?'稍后再取':'送客';
    fit();
  }
  sale.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    const msg=sale.querySelector('.sale-status');msg.textContent='';
    if (b.hasAttribute('data-sale-item')) api.merchantAction('select',Number(b.dataset.saleItem));
    if (b.hasAttribute('data-sale-use')) {
      const a=api.campaign().sellers.active;
      if (api.merchantAction('leave')) {
        window.dispatchEvent(new Event('alchemy:merchant-return-work'));
        window.AlchemyViewState.navigate('work',{workMode:'room'});
        if (a.goods[a.selected].kind==='tool') window.AlchemyEquipmentView.inspect(null);
      }
      return;
    }
    if (b===hold||b===leave) {
      if (api.merchantAction(b===hold?'hold':'leave')) {
        window.dispatchEvent(new Event('alchemy:interaction'));
        if(b===hold) window.AlchemyUX.tell('货已留在柜上，今日收市前可回来取。');
      }
    } else if (b===buy) {
      const c=api.campaign(),a=c.sellers.active,g=a.goods[a.selected];
      if (api.economyAction(g.kind,g.id)) msg.textContent=g.kind==='furnace'?'炉具已改良':g.kind==='tool'?'法器已购入':'已收入备药匣';
    }
  });
  for (const e of ['alchemy:render','alchemy:interaction','alchemy:view-ready']) window.addEventListener(e,render);
  window.AlchemyCounterDisplay={render,focus(){const b=wares.querySelector('[aria-pressed=true]');b?.focus({preventScroll:true});}};
})();
;
/* === Consolidated source: scene-props.js === */
(() => {
 const drawer=document.getElementById('equipmentDrawer'),board=document.querySelector('.counter-board');
 const ids=['seal',null,'ward','stone','lucky','chain','repair','phoenix','breath_pearl','guard_casket','still_incense','hearth_pin','cooling_tag','quiet_lamp','pulse_ring','steady_talisman','slow_plate','pressure_plate','red_nail','fissure_cone','reverse_lamp','scorch_seal','ignite_pearl','risk_ruler','ash_contract','crack_bowl','reverse_fire','broken_link','scar_ruler','ash_box','ember_tray','failed_contract','pattern_tray','market_tag','medicine_seal','material_pouch','consign_plate','craft_mold','material_scale','client_contract','stock_talisman'];
  function decorateTool(el,id){const art=window.AlchemyWarmProps?.tools[id];if(art){el.classList.add('tool-art');el.setAttribute('aria-hidden','true');el.dataset.warmTool=id;el.style.setProperty('--warm-tool-image','url("'+art.src+'")');el.style.backgroundPosition='center';el.style.backgroundSize='100% 100%';return el;}const i=ids.indexOf(id);if(i<0)return null;el.classList.add('tool-art');el.setAttribute('aria-hidden','true');const sprite=i%8;el.style.backgroundPosition=`${(sprite%6)*20}% ${Math.floor(sprite/6)*50}%`;return el;}
 function icon(id){return decorateTool(document.createElement('i'),id);}
 window.AlchemyDecorateTool=decorateTool;
 function decorate(){
  drawer.querySelectorAll('.equipment-slot[data-equipment],.equipment-card').forEach(el=>{const id=el.dataset.equipment||el.querySelector('[data-equipment]')?.dataset.equipment;if(!el.querySelector('.tool-art')){const art=icon(id);if(art)el.prepend(art);}});

 }
 const waiting=document.createElement('div');waiting.className='counter-waiting';waiting.setAttribute('aria-label','候客');board.append(waiting);

 function queue(){const c=window.AlchemyGame.campaign();if(!c)return;const selected=board.querySelector('.counter-ticket.selected')?.dataset.letter,people=c.phase==='open'?window.AlchemyCustomers.waiting(c.orders,selected):[];const key=people.map(o=>o.id).join('|');if(waiting.dataset.key===key)return;waiting.dataset.key=key;waiting.replaceChildren();for(const o of people)waiting.append(window.AlchemyCustomerView.portrait(o,{waiting:true}));}
 new MutationObserver(decorate).observe(drawer,{childList:true,subtree:true});new MutationObserver(queue).observe(document.getElementById('counterVisitor'),{childList:true,subtree:true});window.addEventListener('alchemy:render',()=>{decorate();queue();});decorate();queue();
})();
