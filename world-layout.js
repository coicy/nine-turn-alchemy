/* Geometry is shared by art, anchors and hit targets. Reserve only visible reading surfaces. */
(() => {
 const objects={herbs:{},tool:{src:'alchemy-fan-v1',flat:true},tray:{src:'delivery-tray-v1',flat:true},pill:{}},mouth={},firebox={},cutaway={},bookRest={},toolRest={},judgment={};let key='',lastViewport='';
 function fit(){const viewport=document.querySelector('.engine-viewport'),forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');if(!viewport)return;
  if(window.AlchemyViewState?.snapshot().workMode==='furnace'&&window.AlchemyFurnaceView)return window.AlchemyFurnaceView.fit();
  const mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,compact=!mobile&&w<1280,vkey=w+':'+h;
  if(window.AlchemyScene2D?.held&&lastViewport===vkey)return true;
  const visibleHeight=selector=>{const el=document.querySelector(selector);return el&&!el.hidden&&el.checkVisibility()?el.getBoundingClientRect().height:0;};
  const reading=window.AlchemyViewState?.snapshot(),top=mobile?Math.max(visibleHeight('.world-readout'),visibleHeight('.world-empty-readout')):0;
  let reserve=mobile?Math.max(visibleHeight('#refineOdds'),visibleHeight('.refine-odds-toggle'),visibleHeight('#roomChoices'),visibleHeight('#roomSettlement')):0;
  if(mobile&&reading?.short)reserve=Math.max(reserve,visibleHeight(reading.current==='pill'?'.pill-detail-panel':'.equipment-drawer'));
  const width=mobile?w:1600,height=mobile?Math.max(330,Math.floor(h-top-reserve-20)):900;
  // The room is a fixed physical plane. Reading changes the camera window, never its aspect.
  const s=window.AlchemyGame.snapshot(),near=mobile&&s.started&&s.pillEnded&&!s.roundEnded&&!window.AlchemyOpening?.active;
  const cameraScale=1,roomWidth=mobile?width*cameraScale:width,roomHeight=mobile?roomWidth*1448/1086:900,cameraLeft=mobile?(width-roomWidth)/2:0;
  const project=o=>({x:o.x*cameraScale+cameraLeft,y:o.y*cameraScale,w:o.w*cameraScale,h:o.h*cameraScale});
  const baseHeight=width*1448/1086;
  const next=[mobile,width,height,w,h,top,reserve,cameraScale].join(':');lastViewport=vkey;
  document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',compact);viewport.style.setProperty('--work-top',top+'px');
  Object.assign(cutaway,mobile?{x:width-150,y:baseHeight*.15,w:140,h:114,source:{x:width*.4083,y:baseHeight*.3708,rx:16,ry:12}}:{x:760,y:230,w:210,h:170,source:{x:600,y:440,rx:28,ry:20}});
  Object.assign(objects.pill,{x:cutaway.x+(mobile?38:58),y:cutaway.y+(mobile?28:38),w:mobile?64:94,h:mobile?64:94});
  // The ledge remains in reach while its joint follows the painted table leg through the camera.
  Object.assign(bookRest,{x:width-152,y:roomHeight*.85,w:152,h:10,legX:width*.614*cameraScale+cameraLeft,legY:roomHeight*.89});
  Object.assign(toolRest,{x:width*.59,y:roomHeight*.535-48,w:width*.4,h:53,baseline:roomHeight*.535});
  Object.assign(mouth,mobile?project({x:width*.22,y:baseHeight*.15,w:width*.42,h:baseHeight*.23}):{x:470,y:285,w:310,h:150});
  Object.assign(firebox,mobile?project({x:width*.26,y:baseHeight*.59,w:width*.24,h:baseHeight*.20}):{x:455,y:600,w:210,h:145});
  Object.assign(objects.tray,mobile?{x:width*.907-Math.max(44,width*.12)/2,y:baseHeight*.567,w:Math.max(44,width*.12),h:44}:{x:1370,y:523,w:180,h:78});
  Object.assign(objects.tool,mobile?project({x:width*.52,y:baseHeight*.66,w:58,h:74}):{x:710,y:590,w:110,h:145});Object.assign(objects.herbs,mobile?{x:8,y:roomHeight*.47,w:64,h:65}:{x:80,y:470,w:115,h:100});
  stage.style.setProperty('--scene-scale',mobile?'1':String(Math.min(1,w/width,h/height)));
  for(const el of [stage,forge]){el.style.setProperty('--world-width',width+'px');el.style.setProperty('--world-height',height+'px');el.style.setProperty('--room-base-height',roomHeight+'px');el.style.setProperty('--room-base-width',roomWidth+'px');el.style.setProperty('--room-camera-left',cameraLeft+'px');}
  stage.dataset.camera=near?'near':'work';
  stage.dataset.cameraCropped=String(mobile&&height<bookRest.legY+6);
  for(const [name,value] of Object.entries({x:bookRest.x,y:bookRest.y,postX:bookRest.legX-bookRest.x,postHeight:bookRest.legY-bookRest.y+19,braceLength:Math.hypot(bookRest.legX-bookRest.x+2,bookRest.legY-bookRest.y-9)}))stage.style.setProperty('--book-rest-'+name,value+'px');
  stage.style.setProperty('--book-rest-angle',Math.atan2(bookRest.legY-bookRest.y-9,bookRest.legX-bookRest.x+2)*180/Math.PI+'deg');
  for(const name of ['x','y','w'])stage.style.setProperty('--tool-rest-'+name,toolRest[name]+'px');
  if(mobile){forge.style.transform='none';forge.style.left='0';forge.style.top=top+'px';}else{forge.style.left='50%';forge.style.top='50%';forge.style.transform=`translate(-50%,-50%) scale(${Math.min(1,w/width,h/height)})`;}
  const canvas=document.getElementById('alchemyScene');if(canvas){if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;}
  const observation=document.querySelector('.room-observation');if(observation){observation.style.left=cutaway.x+'px';observation.style.top=cutaway.y+'px';observation.style.setProperty('--inspect-x',8-cutaway.x+'px');observation.style.setProperty('--inspect-y',8-cutaway.y+'px');}
  document.body.style.setProperty('--work-reserve',reserve+'px');if(key!==next){key=next;window.dispatchEvent(new Event('alchemy:world-layout'));}return true;
 }
 window.AlchemyWorldLayout={objects,mouth,firebox,cutaway,bookRest,toolRest,judgment,fit,get mobile(){return innerWidth<=650;}};
})();
