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
  function ready(){const s=state,v=window.AlchemyViewState?.snapshot();return !(v?.reading&&(furnace()||!v.short))&&!fanTimer&&s.started&&!s.busy&&!s.runeChoices?.length&&!window.AlchemyInteractionBusy;}
  function image(src){if(!cache.has(src)){const im=window.AlchemyAssets?.getImage(src)||new Image();const item={im,mask:null};cache.set(src,item);im.onload=()=>{dirty=true;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const k=c.getContext('2d',{willReadFrequently:true});k.drawImage(im,0,0);try{item.mask=k.getImageData(0,0,c.width,c.height);}catch{item.mask=false;}};if(im.complete&&im.naturalWidth)im.onload();else im.src=src;}return cache.get(src);}
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();dirty=true;});
  Object.values(objects).filter(o=>o.src).forEach(o=>image('assets/runtime-v10/'+o.src+'.webp'));
  function available(){const s=state;return !s.order||s.roundEnded?[]:live()?(furnace()?['tool','pill']:[]):s.remaining>0?['herbs']:[];}
  function rect(r,p){return p&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
  function hit(kind,p){const o=objects[kind];return rect(o,p);}
  function tell(text){notice=text;noticeUntil=performance.now()+2200;dirty=true;setTimeout(()=>{dirty=true;},2250);window.AlchemyUX.tell(text);}
  function cancel(){held=null;pointer=null;hover=null;prepareHerbs=null;dirty=true;carry();}
  function use(p){if(!held)return;if(!ready()){cancel();return;}const kind=held,before=state,prepare=prepareHerbs;cancel();if(kind==='pill'&&rect(objects.tray,p)){game.collect();if(game.snapshot().pillEnded){window.dispatchEvent(new CustomEvent('alchemy:world-collect',{detail:{self:!!before.order?.self}}));dirty=true;}}else if(kind==='herbs'&&rect(mouth,p)){if(prepare&&!prepare()){tell('材料暂不可用，请先处理当前委托');return;}game.load();if(!game.snapshot().pillEnded){stage.classList.add('world-pouring');setTimeout(()=>stage.classList.remove('world-pouring'),450);}}else if(kind==='tool'&&rect(firebox,p)){window.AlchemyUX.clearInstruction();window.dispatchEvent(new Event('alchemy:fanning'));const delay=matchMedia('(prefers-reduced-motion: reduce)').matches?0:500;fanningUntil=performance.now()+delay;dirty=true;fanTimer=setTimeout(()=>{fanTimer=null;fanningUntil=0;game.refine();dirty=true;},delay);}else tell('物件已放回原处');}
  window.addEventListener('alchemy:world-layout',()=>{dirty=true;});window.addEventListener('alchemy:pill-surface',()=>{dirty=true;});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*canvas.height/r.height};};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!ready())return;canvas.focus({preventScroll:true});const p=point(e);hover=p;dirty=true;if(held){use(p);return;}if(live()&&state.turn<100&&furnace()&&rect(firebox,p)){held='tool';use(p);return;}const kind=available().find(k=>hit(k,p));if(!kind)return;held=kind;carry();pointer={...p,start:p,moved:false,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const p=point(e);hover=p;dirty=true;if(pointer){pointer.moved ||= Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>8;pointer.x=p.x;pointer.y=p.y;}canvas.style.cursor=held?'grabbing':available().some(k=>hit(k,p))?'grab':'default';});
  canvas.addEventListener('pointerup',e=>{if(!pointer)return;const moved=pointer.moved;pointer=null;if(moved)use(point(e));});
  canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(pointer)cancel();});
  canvas.addEventListener('keydown',e=>{if(!['Enter',' ','Escape'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'){cancel();return;}if(e.repeat||!ready())return;if(held){const r=held==='pill'?objects.tray:held==='tool'?firebox:mouth;use({x:r.x+r.w/2,y:r.y+r.h/2});}else if(live()&&state.turn<100&&furnace()){held='tool';use({x:firebox.x+firebox.w/2,y:firebox.y+firebox.h/2});}},true);
  // Prevent the legacy global Enter shortcut from bypassing scene-object use.
  window.addEventListener('alchemy:view-ready',()=>{dirty=true;});window.addEventListener('blur',cancel);window.addEventListener('alchemy:order',()=>{clearTimeout(fanTimer);fanTimer=null;fanningUntil=0;cancel();});window.addEventListener('alchemy:render',()=>{if(held&&!available().includes(held))cancel();});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  function sprite(kind,x,y,w,h,pill=state){stats.drawn.push(kind);const o=objects[kind];if(kind==='pill'){const diameter=Math.min(w,h,objects.pill.visualDiameter||Math.min(w,h));x+=(w-diameter)/2;y+=(h-diameter)/2;const result=window.AlchemyPillArt.draw(ctx,x,y,diameter,pill);if(result.animating)dirty=true;return;}const im=image('assets/runtime-v10/'+o.src+'.webp').im;if(im.complete&&im.naturalWidth){ctx.save();ctx.fillStyle='#36281933';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.85,w*.4,h*.12,0,0,Math.PI*2);ctx.fill();if(kind==='tool'&&furnace()){ctx.translate(x+w/2,y+h/2);ctx.rotate(Math.PI);ctx.drawImage(im,-w/2,-h/2,w,h);}else ctx.drawImage(im,x,y,w,h);ctx.restore();}}
  function label(text,x,y){ctx.font='19px Microsoft YaHei';ctx.textAlign='center';ctx.fillStyle='#f7ead3';const w=ctx.measureText(text).width+28;ctx.fillRect(x-w/2,y-22,w,32);ctx.fillStyle='#503b29';ctx.fillText(text,x,y);}
  function floorExtension(){
    if(!window.AlchemyWorldLayout.mobile||canvas.width<1)return;
    const base=parseFloat(stage.style.getPropertyValue('--room-base-height')),roomWidth=parseFloat(stage.style.getPropertyValue('--room-base-width')),left=parseFloat(stage.style.getPropertyValue('--room-camera-left'));
    if(!Number.isFinite(base)||canvas.height<=base||roomWidth<1)return;
    const near=furnace(),im=window.AlchemyAssets?.getImage(near?'assets/furnace-view-v102/mobile-v2.webp':'assets/workbench-v92/room-mobile.png');
    if(!im?.naturalWidth)return;
    const sourceH=near?Math.floor(im.naturalHeight*.14):148,sourceY=near?im.naturalHeight-sourceH:1300,tileH=sourceH*roomWidth/im.naturalWidth;
    // Continue the same scene's unobstructed floor; reflected edges meet without a seam.
    for(let y=base-1,index=0;y<canvas.height;y+=tileH,index++){
      ctx.save();ctx.translate(left,y+(near&&index%2===0?tileH:0));if(near&&index%2===0)ctx.scale(1,-1);
      ctx.drawImage(im,0,sourceY,im.naturalWidth,sourceH,0,0,roomWidth,tileH+1);ctx.restore();
    }
  }
  function draw(t){requestAnimationFrame(draw);if(document.hidden||(!dirty&&t>noticeUntil))return;dirty=false;stats.frames++;stats.drawn=[];ctx.clearRect(0,0,canvas.width,canvas.height);floorExtension();const s=state;const list=available();/* Collection plate is painted with the workbench in V92. */if(held!=='tool'&&(t>fanningUntil||matchMedia('(prefers-reduced-motion: reduce)').matches))sprite('tool',objects.tool.x,objects.tool.y,objects.tool.w,objects.tool.h);
    if(furnace()&&live()&&!held&&!s.busy&&t>=fanningUntil){const r=objects.pill,d=r.visualDiameter||r.w,x=r.x+(r.w-d)/2,y=r.y+(r.h-d)/2;ctx.save();ctx.fillStyle='#21170daa';ctx.beginPath();ctx.ellipse(x+d*.55,y+d*.91,d*.4,d*.1,0,0,Math.PI*2);ctx.fill();ctx.restore();sprite('pill',r.x,r.y,r.w,r.h);}
    if(furnace()&&s.pillEnded&&s.endReason==='collect'){const r=objects.tray,p=objects.pill;const size=Math.min(p.w,r.w*.65),x=r.x+(r.w-size)/2,y=r.y+(r.h-size)/2;ctx.save();ctx.fillStyle='#21170d66';ctx.beginPath();ctx.ellipse(x+size*.5,y+size*.9,size*.38,size*.08,0,0,Math.PI*2);ctx.fill();ctx.restore();sprite('pill',x,y,size,size,s);}
    for(const kind of list){if(held===kind){const o=objects[kind];ctx.clearRect(o.x,o.y,o.w,o.h);if(hover){ctx.save();ctx.globalAlpha=.95;sprite(kind,hover.x-o.w/2,hover.y-o.h/2,o.w,o.h);ctx.restore();}}}
    if(fanningUntil>t&&!matchMedia('(prefers-reduced-motion: reduce)').matches){dirty=true;const r=firebox;ctx.save();ctx.translate(r.x+r.w*1.2,r.y+r.h*.65);ctx.rotate(-.65+Math.sin(t/85)*.42);const fan=image('assets/runtime-v10/alchemy-fan-v1.webp').im;if(fan.complete&&fan.naturalWidth)ctx.drawImage(fan,-r.w*.3,-r.h*.8,r.w*.6,r.h*.9);ctx.restore();}
    if(held&&!window.AlchemyFurnaceGuidance){const target=held==='pill'?objects.tray:held==='tool'?firebox:mouth;ctx.save();ctx.strokeStyle=rect(target,hover)?'#709653':'#a65b36';ctx.lineWidth=4;ctx.setLineDash([12,8]);ctx.strokeRect(target.x,target.y,target.w,target.h);ctx.restore();label(rect(target,hover)?'松手使用':'放到这里',target.x+target.w/2,target.y-12);}else if(!held&&hover&&!window.AlchemyFurnaceGuidance){const k=list.find(k=>hit(k,hover));if(k)label({herbs:'从药柜取药包，投入炉口',tool:'拿起扇子，对火门扇风',pill:'从炉口取丹，放入收丹盘'}[k],hover.x,hover.y-30);}
    if(t>noticeUntil){const el=document.getElementById('workInstruction');const next=window.AlchemyUX.instruction(s,held);if(el.textContent!==next)el.textContent=next;el.hidden=!next;}}
  requestAnimationFrame(draw);
  window.AlchemyScene2D={refine:()=>{if(!ready()||!live()||!furnace()||held||state.turn>=100)return false;held='tool';use({x:firebox.x+firebox.w/2,y:firebox.y+firebox.h/2});return true;},collectHeld:()=>{if(held!=='pill')return false;use({x:objects.tray.x+objects.tray.w/2,y:objects.tray.y+objects.tray.h/2});return true;},takeHerbs:(e,prepare)=>{if(!ready()||live()||(!prepare&&(!state.order||state.roundEnded||state.remaining<=0)))return false;held='herbs';prepareHerbs=prepare||null;hover=point(e);dirty=true;carry();return true;},moveHerbs:e=>{hover=point(e);dirty=true;},dropHerbs:e=>use(point(e)),stats,get busy(){return !!fanTimer;},get held(){return held;},objects,mouth,firebox,cancel,takePill:e=>{if(held||!ready()||!live()||!furnace())return false;held='pill';hover=point(e);dirty=true;carry();return true;},movePill:e=>{hover=point(e);dirty=true;},dropPill:e=>use(point(e))};
  window.AlchemyWorldLayout.fit();
})();
