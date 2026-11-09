/* One spatial projection supplies backgrounds, objects and input. Business state stays in AlchemyGame. */
(()=>{'use strict';
 const game=window.AlchemyGame,route=window.AlchemyViewState,L=window.AlchemyWorldLayout,P=window.AlchemySceneProjection;
 const stage=document.getElementById('pillStage'),forge=document.querySelector('.forge-panel'),viewport=document.querySelector('.engine-viewport');
 const judgment=document.querySelector('.furnace-judgment'),facts=judgment.querySelector('.furnace-facts'),herbs=document.querySelector('.herb-tray'),collect=document.querySelector('.furnace-tray');viewport.append(collect);
 document.body.classList.add('scene-continuity','scene-spatial','art-repair');let fitting=false,queued=false,geometry='',heldViewport='',stockKey='',notice='',noticeTimer,noticeScope='';
 const foreground=document.createElement('div');foreground.className='scene-front-mask';foreground.setAttribute('aria-hidden','true');stage.append(foreground);
 const caption=document.createElement('p');caption.className='scene-value-caption';caption.textContent='丹值';judgment.prepend(caption);
 const demand=document.createElement('button');demand.className='scene-demand';demand.type='button';demand.dataset.focusKey='scene-demand';demand.onclick=()=>window.AlchemyLoop.openDemand(demand);
 const shelfNav=document.createElement('div');shelfNav.className='scene-stock-nav';shelfNav.innerHTML='<strong>丹料</strong><span class="scene-balance" aria-label="铜钱"></span><button type="button" data-focus-key="scene-bag" data-scene-view="bag">丹药</button><button type="button" data-focus-key="scene-equipment" data-scene-view="equipment">法器</button>';
 const pills=document.createElement('section');pills.className='scene-pill-stock';pills.setAttribute('aria-label','丹药库存');
 const stockStatus=document.createElement('p');stockStatus.className='scene-stock-status';stockStatus.setAttribute('role','status');stockStatus.hidden=true;
 let unavailableAttempt=false;const originalTell=window.AlchemyUX.tell;
 function markUnavailable(e){unavailableAttempt=!!e.target.closest('.herb-slot[aria-disabled=true][data-slot]');setTimeout(()=>{unavailableAttempt=false;},0);}
 herbs.addEventListener('pointerdown',markUnavailable,true);herbs.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')markUnavailable(e);},true);
 window.AlchemyUX.tell=message=>{if(unavailableAttempt){notice=String(message);const s=game.snapshot();noticeScope=[s.orderId,s.attempt,s.turn,s.pillEnded].join(':');clearTimeout(noticeTimer);noticeTimer=setTimeout(()=>{notice='';schedule();},2800);schedule();}return originalTell(message);};
 herbs.addEventListener('click',e=>{const b=e.target.closest('[data-scene-view]');if(b)route.navigate(b.dataset.sceneView,{anchor:b});const pick=e.target.closest('[data-stock-pill]');if(pick){const id=pick.dataset.stockPill;if(route.navigate('bag',{anchor:pick}))requestAnimationFrame(()=>document.querySelector('.pill-bag-panel [data-pill-id="'+CSS.escape(id)+'"]')?.click());}});
 collect.onclick=()=>{if(window.AlchemyScene2D.held==='pill')window.AlchemyScene2D.collectHeld();else if(!window.AlchemyScene2D.held)game.collect();};
 document.getElementById('roomSettlement').addEventListener('click',e=>{if(e.target.closest('[data-furnace-room]')&&route.snapshot().workMode==='furnace'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('roomSettlement').hidden=true;update();herbs.querySelector('.herb-slot[aria-disabled=false]')?.focus({preventScroll:true});}},true);
 const live=s=>s.started&&!s.pillEnded&&!s.roundEnded;
 const lidState=()=>live(game.snapshot())&&!game.snapshot().busy&&!window.AlchemyScene2D.busy?'open':'closed';
 const rect=(el,r)=>{if(!el)return;for(const [k,n]of Object.entries({left:r.x,top:r.y,width:r.w,height:r.h}))el.style.setProperty(k,n+'px','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');};
 const keyFor=()=> (route.snapshot().workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
 const imageFor=()=> 'assets/scene-illustrated-v128/'+keyFor()+'-'+lidState()+'.webp';
 function stock(){
  if(!herbs.contains(shelfNav))herbs.prepend(shelfNav);if(!herbs.contains(pills))herbs.append(pills);if(!herbs.contains(stockStatus))shelfNav.after(stockStatus);
  const s=game.snapshot(),scope=[s.orderId,s.attempt,s.turn,s.pillEnded].join(':');if(scope!==noticeScope||window.AlchemyScene2D.held)notice='';stockStatus.textContent=notice;stockStatus.hidden=!notice;
  const e=game.campaign()?.economy;if(!e)return;shelfNav.querySelector('.scene-balance').textContent=String(e.coins);
  const list=Array.isArray(e.pills)?e.pills:[];pills.hidden=!list.length;const next=list.map(p=>p.id+':'+p.value+':'+p.turn+':'+(p.runes||[]).join()).join('|');
  if(next!==stockKey||!pills.childElementCount){stockKey=next;window.AlchemyUX.html(pills,'<div class="scene-pill-caption">丹药 <span>'+list.length+'</span></div>'+(list.length?'<div class="scene-pill-row">'+list.map(p=>'<button type="button" data-stock-pill="'+p.id+'" data-focus-key="stock-pill-'+p.id+'" aria-label="查看'+p.turn+'转丹药，丹值'+Math.round(p.value)+'">'+window.AlchemyUX.art(p)+'<span>'+Math.round(p.value)+'</span></button>').join('')+'</div>':''));}
  herbs.querySelectorAll('.herb-slot[data-slot]').forEach(el=>{const title=el.getAttribute('title')||'';el.dataset.shortLabel=title.includes('委托供料')?'本单料':title.startsWith('本炉药包')?'本炉料':title.startsWith('普通药包')?'普通料':title.startsWith('精选药包')?'精选料':title.startsWith('灵性药包')?'灵性料':title.split(' · ')[0];});
 }
 function fit(){if(fitting)return true;fitting=true;try{
  const s=game.snapshot(),v=route.snapshot(),near=v.workMode==='furnace',mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,data=P[keyFor()];if(!w||!h||!data)return true;
  const viewportKey=[near,w,h].join(':');if(window.AlchemyScene2D.held&&heldViewport===viewportKey)return true;heldViewport=viewportKey;
  if(judgment.parentElement!==viewport)viewport.append(judgment);if(herbs.parentElement!==viewport)viewport.append(herbs);
  const items=Math.max(herbs.querySelectorAll('.herb-slot[data-slot]').length,game.campaign()?.economy?.pills?.length||0),dockWidth=mobile?w:Math.min(420,Math.max(248,Math.min(6,items)*68+24));herbs.style.setProperty('width',dockWidth+'px','important');
  const stockHeight=Math.max(112,Math.min(mobile?Math.min(360,Math.max(112,h-245),h*.56):Math.min(360,h*.48),herbs.scrollHeight));
  const sceneH=mobile?Math.max(245,h-stockHeight):h,width=mobile?w:1600,scale=w/width,height=sceneH/scale,imageHeight=width*data.height/data.width,top=(height-imageHeight)/2;
  const next=[near,mobile,w,h,sceneH,width,height].join(':');if(window.AlchemyScene2D.held&&geometry&&geometry!==next)window.AlchemyScene2D.cancel();
  document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',!mobile&&w<1280);
  viewport.style.setProperty('--work-top','0px');document.body.style.setProperty('--work-reserve','0px');
  for(const el of [stage,forge]){for(const [k,n]of Object.entries({'--world-width':width,'--world-height':height,'--room-base-width':width,'--room-base-height':imageHeight,'--room-camera-left':0}))el.style.setProperty(k,n+'px');el.style.setProperty('width',width+'px','important');el.style.setProperty('height',height+'px','important');}
  stage.style.setProperty('--scene-scale',String(scale));stage.style.setProperty('--scene-image-top',top+'px');forge.style.left='0';forge.style.top='0';forge.style.transform='scale('+scale+')';forge.style.transformOrigin='0 0';
  const canvas=document.getElementById('alchemyScene');if(canvas.width!==Math.round(width))canvas.width=Math.round(width);if(canvas.height!==Math.round(height))canvas.height=Math.round(height);
  const src=imageFor();stage.style.setProperty('--scene-v122-image','url("'+src+'")');stage.style.setProperty('--scene-front-image','url("assets/scene-illustrated-v128/'+keyFor()+'-front.webp")');foreground.hidden=!live(s)||!!window.AlchemyScene2D.held||s.busy||window.AlchemyScene2D.busy;stage.dataset.sceneImage=src;stage.dataset.lidState=lidState();stage.dataset.camera='work';stage.dataset.cameraCropped='false';
  const point=p=>({x:p.x*width,y:top+p.y*imageHeight}),project=r=>({x:r.x*width,y:top+r.y*imageHeight,w:r.w*width,h:r.h*imageHeight});
  const minimum=(r,min=44/scale)=>{const nw=Math.max(r.w,min),nh=Math.max(r.h,min);return{x:r.x-(nw-r.w)/2,y:r.y-(nh-r.h)/2,w:nw,h:nh};};
  Object.assign(L.mouth,minimum(project(data.mouth)));Object.assign(L.firebox,minimum(project(data.fire)));
  const center=point(data.pill),diameter=data.pillDiameter*width,size=Math.max(48/scale,diameter);Object.assign(L.objects.pill,{x:center.x-size/2,y:center.y-size/2,w:size,h:size,visualDiameter:diameter});L.cutaway.source=null;
  rect(document.querySelector('.furnace-pill'),L.objects.pill);rect(document.querySelector('.furnace-fire'),L.firebox);rect(document.getElementById('fireResponse'),L.firebox);rect(document.querySelector('.furnace-resume'),L.mouth);
  const x=Math.min(w-76,Math.max(mobile?w*.72:w*.54,data.bodyRight*w+(mobile?10:44))),jw=Math.min(mobile?110:190,w-x-(mobile?3:8)),jy=(top+(data.mouth.y+data.mouth.h)*imageHeight)*scale+(mobile?34:16);
  rect(judgment,{x,y:jy,w:jw,h:220});judgment.style.removeProperty('height');
  const jh=judgment.getBoundingClientRect().height,cy=Math.min(sceneH-52,Math.max(jy+jh+10,0)),adjustedY=Math.min(jy,cy-jh-10);
  judgment.style.setProperty('top',Math.max(8,adjustedY)+'px','important');Object.assign(L.judgment,{x,y:Math.max(8,adjustedY),w:jw,h:jh});
  rect(collect,{x,y:Math.max(8,adjustedY)+jh+10,w:Math.min(90,jw),h:44});Object.assign(L.objects.tray,{x:x/scale,y:(Math.max(8,adjustedY)+jh+10)/scale,w:Math.min(90,jw)/scale,h:44/scale});
  const row=document.querySelector('.world-tool-row');rect(row,{x:0,y:0,w:width,h:height});L.toolRest.slots=[];
  [...row.children].forEach((el,i)=>{const slot=data.tools[i],foot=point(slot.foot),tip=point(slot.top),visual=Math.abs(foot.y-tip.y),r={x:foot.x-visual/2,y:foot.y-visual,w:visual,h:visual},interactive=!mobile&&visual*scale>=44;L.toolRest.slots.push(r);rect(el,r);el.style.setProperty('position','absolute','important');el.style.setProperty('--tool-size',visual+'px');el.style.pointerEvents=interactive?'auto':'none';el.tabIndex=interactive?0:-1;el.setAttribute('aria-hidden',String(!interactive));
   const art=el.querySelector('[data-tool-art]'),index=window.AlchemyEconomy.TOOL_DEFS.findIndex(t=>t.id===art?.dataset.toolArt),bounds=P.toolSprites[index];if(art&&bounds){const frame=visual/(bounds.b-bounds.t);el.style.setProperty('--tool-art-size',frame+'px');el.style.setProperty('--tool-art-left',(visual/2-frame*(bounds.l+bounds.r)/2)+'px');el.style.setProperty('--tool-art-top',(visual-frame*bounds.b)+'px');}
  });
  Object.assign(L.toolRest,{x:0,y:0,w:width,h:height});Object.assign(L.objects.tool,{x:-300,y:-300,w:100,h:100});
  const book=point(data.book),casket=point(data.casket),door=minimum(project(data.door));rect(document.querySelector('.world-book-stack'),{x:book.x-48/scale,y:book.y-30/scale,w:96/scale,h:48/scale});rect(document.querySelector('.world-books'),{x:book.x-48/scale,y:book.y-30/scale,w:96/scale,h:48/scale});rect(document.querySelector('.world-casket'),{x:casket.x-28/scale,y:casket.y-24/scale,w:56/scale,h:48/scale});rect(document.querySelector('.passage-counter'),door);
  for(const sel of ['.world-book-stack','.world-books','.world-casket','.passage-counter']){const el=document.querySelector(sel);const r=el.getBoundingClientRect();el.style.visibility=near||r.right>w||r.left<0||r.bottom>sceneH||r.width<40?'hidden':'visible';}
  rect(herbs,{x:mobile?0:w-dockWidth-12,y:mobile?sceneH:Math.max(0,h-stockHeight-12),w:dockWidth,h:stockHeight});herbs.style.removeProperty('height');herbs.style.setProperty('--stock-max-height',(mobile?h-sceneH:stockHeight)+'px');
  if(geometry!==next){geometry=next;window.dispatchEvent(new Event('alchemy:world-layout'));}return true;
 }finally{fitting=false;}}
 function update(){const s=game.snapshot(),v=route.snapshot(),near=v.workMode==='furnace',heading=document.querySelector('.furnace-heading');stock();
  const host=near?heading:document.querySelector('.engine-nav');if(demand.parentElement!==host)host.append(demand);demand.hidden=v.location!=='work'||!s.order||s.roundEnded;demand.textContent=s.order?.self?'自炼':(s.order?.client||'委托')+' · 还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'丹值';demand.setAttribute('aria-label','查看完整需求，目标'+s.target+'丹值，已交'+Math.round(s.delivered)+'，还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'丹值');
  const amount=facts.querySelector('b');amount.textContent=Math.round(s.value);amount.style.fontSize=amount.textContent.length>7?(innerWidth<=340?'14px':'18px'):amount.textContent.length>4?'22px':innerWidth<=650?'28px':'32px';amount.style.lineHeight='1.2';facts.querySelector('span').textContent=s.turn+'转';facts.querySelector('small').hidden=true;
  judgment.hidden=!near||v.current!=='work'||!live(s)||!!s.runeChoices?.length;
  const back=heading.querySelector('.furnace-back');back.textContent='‹';back.setAttribute('aria-label','返回炼丹房');
  herbs.classList.add('scene-stock');herbs.dataset.sceneVisible=String(v.location==='work'&&v.current==='work'&&document.getElementById('roomSettlement').hidden);
  document.body.dataset.sceneAtWork=String(v.location==='work');document.body.dataset.sceneReading=String(v.reading);
  collect.dataset.sceneLabel='收丹';collect.setAttribute('aria-label','收丹');collect.hidden=!near||v.current!=='work'||!live(s)||!!s.runeChoices?.length;collect.dataset.held=String(window.AlchemyScene2D.held==='pill');collect.disabled=!live(s)||s.busy||window.AlchemyScene2D.busy||!!s.runeChoices?.length||!!(window.AlchemyScene2D.held&&window.AlchemyScene2D.held!=='pill');
  const restock=document.querySelector('[data-furnace-room]');if(restock)restock.textContent='继续取料';fit();
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});};
 window.AlchemySceneContinuity={fitFurnace:fit,fitRoom:fit,imageFor,lidState,get image(){return imageFor();},version:128};L.fit=fit;
 for(const event of ['alchemy:render','alchemy:fanning','alchemy:interaction','alchemy:carry','alchemy:view-ready','alchemy:order','alchemy:opening-finished','alchemy:ux-layout','resize'])window.addEventListener(event,schedule);
 new ResizeObserver(schedule).observe(viewport);update();
})();
