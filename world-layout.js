/* Geometry is shared by art, anchors and hit targets. Reserve only visible reading surfaces. */
(() => {
 const objects={herbs:{},tool:{src:'alchemy-fan-v1',flat:true},tray:{src:'delivery-tray-v1',flat:true},pill:{}},mouth={},firebox={};let key='',lastViewport='';
 function fit(){const viewport=document.querySelector('.engine-viewport'),forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');if(!viewport)return;
  const mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,compact=!mobile&&w<1280,vkey=w+':'+h;
  if(window.AlchemyScene2D?.held&&lastViewport===vkey)return true;
  const visibleHeight=selector=>{const el=document.querySelector(selector);return el&&!el.hidden&&el.checkVisibility()?el.getBoundingClientRect().height:0;};
  const reading=window.AlchemyViewState?.snapshot(),top=mobile?visibleHeight('.world-readout'):0;
  let reserve=mobile?Math.max(visibleHeight('#refineOdds'),visibleHeight('.refine-odds-toggle'),visibleHeight('#roomChoices'),visibleHeight('#roomSettlement')):0;
  if(mobile&&reading?.short)reserve=Math.max(reserve,visibleHeight(reading.current==='pill'?'.pill-detail-panel':'.equipment-drawer'));
  const width=mobile?w:compact?1100:1600,height=mobile?Math.max(330,Math.floor(h-top-reserve-20)):900;
  const next=[mobile,width,height,w,h,top,reserve].join(':');lastViewport=vkey;
  document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',compact);viewport.style.setProperty('--work-top',top+'px');
  Object.assign(objects.pill,mobile?{x:width*.35,y:height*.24,w:64,h:64}:{x:515,y:310,w:94,h:94});
  Object.assign(mouth,mobile?{x:width*.22,y:height*.15,w:width*.42,h:height*.23}:{x:470,y:285,w:310,h:150});
  Object.assign(firebox,mobile?{x:width*.26,y:height*.59,w:width*.24,h:height*.20}:{x:455,y:600,w:210,h:145});
  Object.assign(objects.tray,mobile?{x:width*.72,y:height*.54,w:width*.25,h:Math.max(48,height*.15)}:{x:compact?900:1330,y:470,w:compact?170:195,h:100});
  Object.assign(objects.tool,mobile?{x:width*.52,y:height*.66,w:58,h:74}:{x:710,y:590,w:110,h:145});Object.assign(objects.herbs,mobile?{x:8,y:height*.47,w:64,h:65}:{x:80,y:470,w:115,h:100});
  stage.style.setProperty('--scene-scale',mobile?'1':String(Math.min(1,w/width,h/height)));
  for(const el of [stage,forge]){el.style.setProperty('--world-width',width+'px');el.style.setProperty('--world-height',height+'px');}
  if(mobile){forge.style.transform='none';forge.style.left='0';forge.style.top=top+'px';}else{forge.style.left='50%';forge.style.top='50%';forge.style.transform=`translate(-50%,-50%) scale(${Math.min(1,w/width,h/height)})`;}
  const canvas=document.getElementById('alchemyScene');if(canvas){if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;}
  const observation=document.querySelector('.room-observation');if(observation){observation.style.left=(objects.pill.x-(mobile?38:58))+'px';observation.style.top=(objects.pill.y-(mobile?28:38))+'px';}
  document.body.style.setProperty('--work-reserve',reserve+'px');if(key!==next){key=next;window.dispatchEvent(new Event('alchemy:world-layout'));}return true;
 }
 window.AlchemyWorldLayout={objects,mouth,firebox,fit,get mobile(){return innerWidth<=650;}};
})();
