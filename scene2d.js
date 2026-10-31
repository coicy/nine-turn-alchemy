(() => {
  'use strict';
  const stage=document.getElementById('pillStage'), game=window.AlchemyGame;
  const canvas=document.createElement('canvas');canvas.id='alchemyScene';canvas.width=1600;canvas.height=900;canvas.tabIndex=0;canvas.setAttribute('aria-label','炼丹场景：药包投入炉口，扇子用于火门，丹药放入收丹盘。Tab选择物件，Enter拿起或放下，Escape取消。');stage.append(canvas);
  document.body.classList.add('canvas-room');
  const ctx=canvas.getContext('2d'),cache=new Map();
  let state=game.snapshot(),dirty=true; const stats={frames:0,drawn:[]};
  window.addEventListener('alchemy:render',()=>{state=game.snapshot();noticeUntil=0;dirty=true;});
  const objects={herbs:{x:855,y:305,w:125,h:105,src:'herb-parcel-v1'},tool:{x:1030,y:465,w:190,h:85,src:'alchemy-fan-v1',flat:true},tray:{x:1330,y:470,w:195,h:100,src:'delivery-tray-v1',flat:true},pill:{x:550,y:305,w:120,h:85}};
  const mouth={x:470,y:285,w:310,h:150}, firebox={x:455,y:600,w:210,h:145};
  let fanningUntil=0,fanTimer=null;
  let held=null,pointer=null,hover=null,focusIndex=0,notice='',noticeUntil=0;
  const live=()=>{const s=state;return s.started&&!s.roundEnded&&!s.pillEnded;};
  function ready(){const s=state;return !fanTimer&&s.started&&!s.busy&&!s.runeChoices?.length&&!window.AlchemyInteractionBusy;}
  function image(src){if(!cache.has(src)){const im=window.AlchemyAssets?.getImage(src)||new Image();const item={im,mask:null};cache.set(src,item);im.onload=()=>{dirty=true;const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;const k=c.getContext('2d',{willReadFrequently:true});k.drawImage(im,0,0);try{item.mask=k.getImageData(0,0,c.width,c.height);}catch{item.mask=false;}};if(im.complete&&im.naturalWidth)im.onload();else im.src=src;}return cache.get(src);}
  window.addEventListener('alchemy:assets-ready',()=>{cache.clear();dirty=true;});
  Object.values(objects).filter(o=>o.src).forEach(o=>image('assets/runtime-v10/'+o.src+'.webp'));
  function available(){const s=state;return !s.order||s.roundEnded?[]:live()?['tool','pill']:s.remaining>0?['herbs']:[];}
  function rect(r,p){return p&&p.x>=r.x&&p.x<=r.x+r.w&&p.y>=r.y&&p.y<=r.y+r.h;}
  function hit(kind,p){if(kind==='pill'&&rect({x:document.body.classList.contains('compact-forge')?58:788,y:220,w:90,h:90},p))return true;const o=objects[kind];if(!rect(o,p))return false;if(o.flat)return Math.hypot((p.x-o.x-o.w/2)/(o.w/2),(p.y-o.y-o.h/2)/(o.h/2))<=1;if(!o.src)return Math.hypot((p.x-o.x-o.w/2)/(o.w/2),(p.y-o.y-o.h/2)/(o.h/2))<=1;const a=image('assets/runtime-v10/'+o.src+'.webp');if(!a.mask)return a.im.complete&&a.im.naturalWidth>0;const x=Math.min(a.mask.width-1,Math.floor((p.x-o.x)/o.w*a.mask.width)),y=Math.min(a.mask.height-1,Math.floor((p.y-o.y)/o.h*a.mask.height));return a.mask.data[(y*a.mask.width+x)*4+3]>40;}
  function tell(text){notice=text;noticeUntil=performance.now()+2200;dirty=true;setTimeout(()=>{dirty=true;},2250);document.getElementById('workInstruction').textContent=text;}
  function cancel(){held=null;pointer=null;hover=null;dirty=true;}
  function use(p){if(!held)return;if(!ready()){cancel();return;}const kind=held;cancel();if(kind==='pill'&&rect(objects.tray,p)){game.collect();if(!state.roundEnded)tell(state.order?.self?'丹药已出售':'丹药已收入本单');}else if(kind==='herbs'&&rect(mouth,p)){game.load();}else if(kind==='tool'&&rect(firebox,p)){window.dispatchEvent(new Event("alchemy:fanning"));fanningUntil=performance.now()+500;dirty=true;fanTimer=setTimeout(()=>{fanTimer=null;fanningUntil=0;game.refine();dirty=true;},500);}else tell('物件已放回原处');}
  window.addEventListener('alchemy:layout',()=>{const compact=document.body.classList.contains('compact-forge');canvas.width=compact?1100:1600;objects.tray.x=compact?900:1330;objects.tray.w=compact?170:195;cancel();dirty=true;});
  const point=e=>{const r=canvas.getBoundingClientRect();return{x:(e.clientX-r.left)*canvas.width/r.width,y:(e.clientY-r.top)*900/r.height};};
  canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!ready())return;canvas.focus({preventScroll:true});const p=point(e);hover=p;dirty=true;if(held){use(p);return;}if(live()&&rect(firebox,p)){held='tool';use(p);return;}const kind=available().find(k=>hit(k,p));if(!kind)return;held=kind;pointer={...p,start:p,moved:false,id:e.pointerId};canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{const p=point(e);hover=p;dirty=true;if(pointer){pointer.moved ||= Math.hypot(p.x-pointer.start.x,p.y-pointer.start.y)>8;pointer.x=p.x;pointer.y=p.y;}canvas.style.cursor=held?'grabbing':available().some(k=>hit(k,p))?'grab':'default';});
  canvas.addEventListener('pointerup',e=>{if(!pointer)return;const moved=pointer.moved;pointer=null;if(moved)use(point(e));});
  canvas.addEventListener('pointercancel',cancel);canvas.addEventListener('lostpointercapture',()=>{if(pointer)cancel();});
  canvas.addEventListener('keydown',e=>{if(!['Tab','Enter',' ','Escape'].includes(e.key))return;e.preventDefault();e.stopImmediatePropagation();if(e.key==='Escape'){cancel();return;}const list=available();if(e.key==='Tab'){if(e.shiftKey){cancel();canvas.blur();return;}focusIndex=(focusIndex+1)%Math.max(1,list.length);hover=list.length?{x:objects[list[focusIndex]].x+objects[list[focusIndex]].w/2,y:objects[list[focusIndex]].y+objects[list[focusIndex]].h/2}:null;return;}if(e.repeat||!ready())return;if(held){use(held==='pill'?{x:objects.tray.x+objects.tray.w/2,y:515}:held==='tool'?{x:550,y:665}:{x:620,y:360});}else if(list.length){held=list[focusIndex%list.length];tell('已拿起物件，再按Enter用于目标，Escape放回');}},true);
  // Prevent the legacy global Enter shortcut from bypassing scene-object use.
  window.addEventListener('blur',cancel);window.addEventListener('alchemy:order',()=>{clearTimeout(fanTimer);fanTimer=null;fanningUntil=0;cancel();});window.addEventListener('alchemy:render',()=>{if(held&&!available().includes(held))cancel();});document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel();});
  function sprite(kind,x,y,w,h){stats.drawn.push(kind);const o=objects[kind];if(kind==='pill'){const diameter=Math.min(w,h);x+=(w-diameter)/2;y+=(h-diameter)/2;w=diameter;h=diameter;const s=state,a=window.AlchemyPillArt.selection(s.order?.nature,s.quality,s.runes);const im=image(a.body).im;if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-w*.227,y-h*.227,w*1.454,h*1.454);for(const src of a.cracks){const im=image(src).im;if(im.complete&&im.naturalWidth)ctx.drawImage(im,x-w*.227,y-h*.227,w*1.454,h*1.454);}return;}const im=image('assets/runtime-v10/'+o.src+'.webp').im;if(im.complete&&im.naturalWidth){if(o.flat){ctx.save();ctx.fillStyle='#36281933';ctx.beginPath();ctx.ellipse(x+w/2,y+h*.72,w*.4,h*.17,0,0,Math.PI*2);ctx.fill();if(kind==='tool'){ctx.translate(x+w/2,y+h/2);ctx.scale(1,.42);ctx.rotate(-Math.PI*.36);ctx.drawImage(im,-w/2,-w/2,w,w);}else ctx.drawImage(im,x,y,w,h);ctx.restore();}else ctx.drawImage(im,x,y,w,h);}}
  function label(text,x,y){ctx.font='19px Microsoft YaHei';ctx.textAlign='center';ctx.fillStyle='#f7ead3';const w=ctx.measureText(text).width+28;ctx.fillRect(x-w/2,y-22,w,32);ctx.fillStyle='#503b29';ctx.fillText(text,x,y);}
  function draw(t){requestAnimationFrame(draw);if(document.hidden||(!dirty&&t>noticeUntil))return;dirty=false;stats.frames++;stats.drawn=[];ctx.clearRect(0,0,1600,900);const s=state;const list=available();{sprite('tray',objects.tray.x,objects.tray.y,objects.tray.w,objects.tray.h);}
    for(const kind of list){if(held===kind){const o=objects[kind];ctx.clearRect(o.x,o.y,o.w,o.h);if(hover){ctx.save();ctx.globalAlpha=.95;sprite(kind,hover.x-o.w/2,hover.y-o.h/2,o.w,o.h);ctx.restore();}}}
    if(fanningUntil>t){dirty=true;ctx.save();ctx.translate(700,735);ctx.rotate(-.65+Math.sin(t/85)*.42);const fan=image('assets/runtime-v10/alchemy-fan-v1.webp').im;if(fan.complete&&fan.naturalWidth)ctx.drawImage(fan,-75,-165,150,165);ctx.restore();}
    if(held){const target=held==='pill'?objects.tray:held==='tool'?firebox:mouth;ctx.save();ctx.strokeStyle=rect(target,hover)?'#709653':'#a65b36';ctx.lineWidth=4;ctx.setLineDash([12,8]);ctx.strokeRect(target.x,target.y,target.w,target.h);ctx.restore();label(rect(target,hover)?'松手使用':'放到这里',target.x+target.w/2,target.y-12);}else if(hover){const k=list.find(k=>hit(k,hover));if(k)label({herbs:'从药柜取药包，投入炉口',tool:'拿起扇子，对火门扇风',pill:'从炉口取丹，放入收丹盘'}[k],hover.x,hover.y-30);}
    if(t>noticeUntil){const el=document.getElementById('workInstruction');const next=window.AlchemyOnboarding?.instruction(s)||(!s.order?'前往接待柜台，选择委托':s.roundEnded?(s.order.self?'自炼已结算 · 前往坊市购料或柜台接单':'本单已结清 · 前往接待柜台接下一单'):s.runeChoices?.length?'请先完成丹纹选择':s.busy?'正在炼化…':held?(held==='pill'?'将丹药放入收丹盘':'将手中物件用于炉口'):live()?'点击火门扇风，或从炉口取丹放入收丹盘':'从药柜取药包，投入炉口');if(el.textContent!==next)el.textContent=next;}}
  requestAnimationFrame(draw);
  window.AlchemyScene2D={takeHerbs:e=>{if(!ready()||live()||!state.order||state.roundEnded||state.remaining<=0)return false;held='herbs';hover=point(e);dirty=true;return true;},moveHerbs:e=>{hover=point(e);dirty=true;},dropHerbs:e=>use(point(e)),stats,get busy(){return !!fanTimer;},get held(){return held;},objects,mouth,firebox,cancel};
})();











