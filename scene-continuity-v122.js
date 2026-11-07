/* One room and one live furnace state, projected into four camera/viewport combinations. */
(()=>{'use strict';
 const game=window.AlchemyGame,route=window.AlchemyViewState,L=window.AlchemyWorldLayout;
 const stage=document.getElementById('pillStage'),forge=document.querySelector('.forge-panel'),viewport=document.querySelector('.engine-viewport');
 const judgment=document.querySelector('.furnace-judgment'),facts=judgment.querySelector('.furnace-facts'),herbs=document.querySelector('.herb-tray');
 const collectButton=document.querySelector('.furnace-tray');viewport.append(collectButton);
 const assetRoot='assets/scene-continuity-v122/';let fitting=false,queued=false,lastGeometry='',currentImage='',heldViewport='';
 document.body.classList.add('scene-continuity');
 const caption=document.createElement('p');caption.className='scene-value-caption';caption.textContent='炉中丹值';judgment.prepend(caption);
 const demand=document.createElement('button');demand.className='scene-demand';demand.type='button';demand.onclick=()=>route.navigate('orders',{anchor:demand});
 const shelfNav=document.createElement('div');shelfNav.className='scene-stock-nav';shelfNav.innerHTML='<strong>丹料</strong><span class="scene-balance" aria-label="铜钱"></span><button type="button" data-scene-view="bag">丹匣</button><button type="button" data-scene-view="equipment">法器</button>';
 herbs.prepend(shelfNav);shelfNav.onclick=e=>{const b=e.target.closest('[data-scene-view]');if(b)route.navigate(b.dataset.sceneView,{anchor:b});};
 collectButton.onclick=()=>{if(window.AlchemyScene2D?.held==='pill')window.AlchemyScene2D.collectHeld();else if(!window.AlchemyScene2D?.held)game.collect();};
 document.getElementById('roomSettlement').addEventListener('click',e=>{if(e.target.closest('[data-furnace-room]')&&route.snapshot().workMode==='furnace'){e.preventDefault();e.stopImmediatePropagation();document.getElementById('roomSettlement').hidden=true;update();herbs.querySelector('.herb-slot[aria-disabled=false]')?.focus({preventScroll:true});}},true);
 const rect=(el,r)=>{if(!el)return;for(const [k,v]of Object.entries({left:r.x,top:r.y,width:r.w,height:r.h}))el.style.setProperty(k,v+'px','important');el.style.setProperty('right','auto','important');el.style.setProperty('bottom','auto','important');};
 const live=s=>s.started&&!s.pillEnded&&!s.roundEnded;
 function lidState(){const s=game.snapshot();return live(s)&&!s.busy&&!window.AlchemyScene2D?.busy?'open':'closed';}
 function imageFor(near=route.snapshot().workMode==='furnace'){return assetRoot+(near?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop')+'-'+lidState()+'.webp';}
 function visibleHeight(selector){const el=document.querySelector(selector);return el&&!el.hidden&&el.checkVisibility()?el.getBoundingClientRect().height:0;}
 function fit(){
  if(fitting)return true;fitting=true;
  try{
   const near=route.snapshot().workMode==='furnace',mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight;
   if(!w||!h)return true;
   const heldKey=[near,w,h].join(':');if(window.AlchemyScene2D?.held&&heldViewport===heldKey)return true;heldViewport=heldKey;
   const s=game.snapshot(),v=route.snapshot();
   if(judgment.parentElement!==viewport)viewport.append(judgment);
   if(herbs.parentElement!==viewport)viewport.append(herbs);
   const width=mobile?w:1600,ratio=near?1.25:4/3;
   const reserve=mobile?Math.max(visibleHeight('#roomChoices'),visibleHeight('#roomSettlement'),v.reading&&v.short?visibleHeight(v.current==='pill'?'.pill-detail-panel':'.equipment-drawer'):0):0;
   const imageHeight=mobile?Math.min(width*ratio,Math.max(230,h-reserve-8)):900,imageWidth=mobile?imageHeight/ratio:1600;
   const left=(width-imageWidth)/2,height=mobile?imageHeight:900,scale=mobile?1:Math.min(w/width,h/height,1.6);
   const ox=mobile?0:(w-width*scale)/2,oy=mobile?0:(h-height*scale)/2;
   const project=(x,y,rw,rh)=>({x:left+x*imageWidth,y:y*imageHeight,w:rw*imageWidth,h:rh*imageHeight});
   const screen=(x,y,rw,rh)=>({x:ox+(left+x*imageWidth)*scale,y:oy+y*imageHeight*scale,w:rw*imageWidth*scale,h:rh*imageHeight*scale});
   const key=[near,mobile,width,height,imageWidth,scale,ox,oy].join(':');
   if(window.AlchemyScene2D?.held&&lastGeometry&&lastGeometry!==key)window.AlchemyScene2D.cancel();
   document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',!mobile&&w<1280);
   viewport.style.setProperty('--work-top','0px');document.body.style.setProperty('--work-reserve','0px');
   for(const el of [stage,forge])for(const [k,n]of Object.entries({'--world-width':width,'--world-height':height,'--room-base-width':imageWidth,'--room-base-height':imageHeight,'--room-camera-left':left}))el.style.setProperty(k,n+'px');
   stage.style.setProperty('--scene-scale',String(scale));forge.style.left=mobile?'0':'50%';forge.style.top=mobile?'0':'50%';forge.style.transform=mobile?'none':'translate(-50%,-50%) scale('+scale+')';
   const canvas=document.getElementById('alchemyScene');if(canvas.width!==Math.round(width))canvas.width=Math.round(width);if(canvas.height!==Math.round(height))canvas.height=Math.round(height);
   const src=imageFor(near);stage.style.setProperty('--scene-v122-image','url("'+src+'")');stage.dataset.sceneImage=src;stage.dataset.lidState=lidState();stage.dataset.camera='work';stage.dataset.cameraCropped='false';currentImage=src;
   const mouth=near?(mobile?[.105,.205,.49,.28]:[.16,.13,.35,.33]):(mobile?[.26,.28,.30,.08]:[.29,.355,.18,.10]);
   const fire=near?(mobile?[.22,.65,.28,.18]:[.235,.67,.19,.24]):(mobile?[.30,.48,.20,.12]:[.30,.68,.15,.13]);
   Object.assign(L.mouth,project(...mouth));Object.assign(L.firebox,project(...fire));
   const center=near?(mobile?[.34,.355]:[.335,.335]):(mobile?[.40,.32]:[.38,.405]);
   const visual=mobile?(near?44:30):(near?88:48)/scale,size=Math.max(48/scale,visual),p=project(...center,0,0);
   Object.assign(L.objects.pill,{x:p.x-size/2,y:p.y-size/2,w:size,h:size,visualDiameter:visual});L.cutaway.source=null;
   const tray=near?(mobile?[.685,.825,.23,.11]:[.60,.76,.16,.09]):(mobile?[.835,.645,.12,.07]:[.91,.63,.075,.06]);Object.assign(L.objects.tray,project(...tray));
   for(const [dimension,coordinate]of [['w','x'],['h','y']]){const previous=L.objects.tray[dimension],next=Math.max(previous,44/scale);L.objects.tray[coordinate]-=(next-previous)/2;L.objects.tray[dimension]=next;}
   Object.assign(L.objects.tool,project(...(near?[.52,.75,.07,.1]:[.69,.57,.05,.08])));
   rect(document.querySelector('.furnace-pill'),L.objects.pill);rect(document.querySelector('.furnace-fire'),L.firebox);rect(document.getElementById('fireResponse'),L.firebox);
   if(!near)rect(document.querySelector('.furnace-resume'),L.mouth);
   const jr=screen(mobile?.655:.60,mobile?(w<=340?.38:.39):.41,mobile?.28:.17,0);rect(judgment,{...jr,w:mobile?Math.max(90,jr.w):Math.min(190,Math.max(150,jr.w)),h:judgment.scrollHeight||230});judgment.style.removeProperty('height');
   Object.assign(L.judgment,{x:jr.x,y:jr.y,w:jr.w,h:judgment.getBoundingClientRect().height});
   const readingBottom=judgment.getBoundingClientRect().bottom-viewport.getBoundingClientRect().top;
   if(near&&!judgment.hidden){const target={x:jr.x,y:readingBottom+10,w:84,h:44};rect(collectButton,target);const sr=stage.getBoundingClientRect(),vr=viewport.getBoundingClientRect();Object.assign(L.objects.tray,{x:(target.x+vr.x-sr.x)/scale,y:(target.y+vr.y-sr.y)/scale,w:target.w/scale,h:target.h/scale});}
   const row=document.querySelector('.world-tool-row'),slotSize=Math.max(44/scale,mobile?44:62),ys=mobile?.633:.585,xs=mobile?[.61,.72,.83]:[.704,.782,.855];
   Object.assign(L.toolRest,project(xs[0]-.04,ys-.085,xs[2]-xs[0]+.08,.10));rect(row,L.toolRest);L.toolRest.slots=[];
   [...row.children].forEach((el,i)=>{const c=project(xs[i]||xs[0],ys,0,0),r={x:c.x-slotSize/2,y:c.y-slotSize,w:slotSize,h:slotSize};L.toolRest.slots.push(r);el.style.setProperty('position','absolute','important');rect(el,{...r,x:r.x-L.toolRest.x,y:r.y-L.toolRest.y});});row.style.setProperty('--tool-size',slotSize+'px');
   rect(document.querySelector('.world-books'),project(.585,.58,.13,.10));rect(document.querySelector('.world-book-stack'),project(.40,.62,.19,.09));rect(document.querySelector('.world-casket'),project(...(mobile?[.73,.645,.11,.07]:[.84,.62,.075,.065])));
   rect(document.querySelector('.passage-counter'),project(...(mobile?[.84,.12,.14,.07]:[.87,.20,.105,.12])));
   const dock=mobile?{x:8,y:Math.min(h-80,Math.max(imageHeight+8,near&&!judgment.hidden?readingBottom+64:0)),w:w-16,h:100}:near?{x:ox+width*scale*.60,y:Math.max(oy+height*scale*.83,!judgment.hidden?readingBottom+64:0),w:Math.max(270,width*scale*.33),h:100}:{x:ox+12,y:oy+height*scale*.69,w:Math.max(210,width*scale*.22),h:120};
   if(!mobile)dock.w=Math.max(near?260:210,Math.min(dock.w,herbs.querySelectorAll('.herb-slot[data-slot]').length*72+20));
   rect(herbs,dock);herbs.style.removeProperty('height');herbs.style.setProperty('--stock-max-height',Math.max(76,h-dock.y-6)+'px');
   if(lastGeometry!==key){lastGeometry=key;window.dispatchEvent(new Event('alchemy:world-layout'));}
   return true;
  }finally{fitting=false;}
 }
 function update(){
  const s=game.snapshot(),v=route.snapshot(),near=v.workMode==='furnace',heading=document.querySelector('.furnace-heading');
  const host=near?heading:document.querySelector('.engine-nav');if(demand.parentElement!==host)host.append(demand);
  demand.hidden=v.location!=='work'||!s.order||s.roundEnded;
  demand.textContent=s.order?.self?'自炼':(s.order?.client||s.order?.name||'委托')+' · 还需'+Math.max(0,Math.ceil(s.target-s.delivered));
  demand.setAttribute('aria-label',s.order?.self?'自炼备料':'查看完整需求，目标'+s.target+'丹值，已交'+Math.round(s.delivered)+'，还需'+Math.max(0,Math.ceil(s.target-s.delivered))+'丹值');
  const amount=facts.querySelector('b');amount.textContent=Math.round(s.value);const digits=amount.textContent.length,available=Math.max(78,judgment.clientWidth||innerWidth*.25),font=Math.min(innerWidth<=650?28:34,Math.max(16,(available-4)/(Math.max(1,digits)*.62)));amount.style.fontSize=font+'px';amount.style.lineHeight=(font+4)+'px';facts.querySelector('span').textContent=s.turn+'转';facts.querySelector('small').hidden=true;
  judgment.hidden=!near||v.current!=='work'||!live(s)||!!s.runeChoices?.length;
  const back=heading.querySelector('.furnace-back');back.textContent='‹';back.setAttribute('aria-label','返回炼丹房');
  if(!herbs.contains(shelfNav))herbs.prepend(shelfNav);
  shelfNav.querySelector('.scene-balance').textContent='◎ '+(game.campaign()?.economy?.coins||0);
  herbs.querySelectorAll('.herb-slot[data-slot]').forEach(el=>{const title=el.getAttribute('title')||'';el.dataset.shortLabel=title.includes('委托供料')?'本单料':title.startsWith('本炉药包')?'本炉料':title.startsWith('普通药包')?'普通料':title.startsWith('精选药包')?'精选料':title.startsWith('灵性药包')?'灵性料':title.split(' · ')[0];});
  herbs.querySelectorAll('.herb-slot [class=world-herb-source]').forEach(e=>e.hidden=true);
  const atWork=v.location==='work';herbs.classList.toggle('scene-stock',atWork);herbs.dataset.sceneVisible=String(atWork&&v.current==='work'&&(!near||document.getElementById('roomSettlement').hidden));
  const tray=document.querySelector('.furnace-tray');tray.setAttribute('data-scene-label','收丹');tray.setAttribute('aria-label','收丹');tray.hidden=!near||!live(s)||!!s.runeChoices?.length;tray.dataset.held=String(window.AlchemyScene2D?.held==='pill');tray.disabled=!live(s)||s.busy||window.AlchemyScene2D?.busy||!!s.runeChoices?.length||!!(window.AlchemyScene2D?.held&&window.AlchemyScene2D.held!=='pill');
  const restock=document.querySelector('[data-furnace-room]');if(restock)restock.textContent='继续取料';
  fit();
 }
 function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;update();});}
 window.AlchemySceneContinuity={fitFurnace:fit,fitRoom:fit,imageFor,lidState,get image(){return currentImage;}};
 L.fit=fit;
 for(const event of ['alchemy:render','alchemy:fanning','alchemy:interaction','alchemy:carry','alchemy:view-ready','alchemy:order','alchemy:opening-finished','alchemy:ux-layout','resize'])window.addEventListener(event,schedule);
 new ResizeObserver(schedule).observe(viewport);update();
})();
