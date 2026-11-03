/* One geometry source for painted objects, pointer targets and DOM anchors. */
(() => {
  'use strict';
  const objects={herbs:{},tool:{src:'alchemy-fan-v1',flat:true},tray:{src:'delivery-tray-v1',flat:true},pill:{}};
  const mouth={},firebox={};let key='';
  function fit(){
    const viewport=document.querySelector('.engine-viewport'),forge=document.querySelector('.forge-panel'),stage=document.getElementById('pillStage');if(!viewport)return;
    const mobile=innerWidth<=650,w=viewport.clientWidth,h=viewport.clientHeight,compact=!mobile&&w<1280;
    const width=mobile?w:compact?1100:1600,height=mobile?Math.max(330,h-248):900;
    const next=[mobile,width,height,w,h].join(':');
    document.body.classList.toggle('world-mobile',mobile);document.body.classList.toggle('compact-forge',compact);
    Object.assign(objects.pill,mobile?{x:width*.35,y:height*.30,w:64,h:64}:{x:515,y:310,w:94,h:94});
    Object.assign(mouth,mobile?{x:width*.22,y:height*.20,w:width*.42,h:height*.23}:{x:470,y:285,w:310,h:150});
    Object.assign(firebox,mobile?{x:width*.26,y:height*.59,w:width*.24,h:height*.20}:{x:455,y:600,w:210,h:145});
    Object.assign(objects.tray,mobile?{x:width*.72,y:height*.54,w:width*.25,h:Math.max(48,height*.15)}:{x:compact?900:1330,y:470,w:compact?170:195,h:100});
    Object.assign(objects.tool,mobile?{x:width*.52,y:height*.66,w:58,h:74}:{x:710,y:590,w:110,h:145});
    Object.assign(objects.herbs,mobile?{x:8,y:height*.47,w:64,h:65}:{x:80,y:470,w:115,h:100});
    stage.style.setProperty('--world-width',width+'px');stage.style.setProperty('--world-height',height+'px');
    forge.style.setProperty('--world-width',width+'px');forge.style.setProperty('--world-height',height+'px');
    if(mobile){forge.style.transform='none';forge.style.left='0';forge.style.top='68px';}
    else{forge.style.left='50%';forge.style.top='50%';forge.style.transform=`translate(-50%,-50%) scale(${Math.min(1,w/width,h/height)})`;}
    const canvas=document.getElementById('alchemyScene');if(canvas){if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;}
    for(const [selector,r] of [['.room-observation',objects.pill],['.world-fan-target',objects.tool],['.world-tray-target',objects.tray]]){
      const el=document.querySelector(selector);if(!el)continue;
      if(selector==='.room-observation'){el.style.left=(r.x-(mobile?38:58))+'px';el.style.top=(r.y-(mobile?28:38))+'px';}
      else Object.assign(el.style,{left:r.x+'px',top:r.y+'px',width:r.w+'px',height:r.h+'px'});
    }
    document.body.style.setProperty('--work-reserve','0px');
    if(key!==next){key=next;window.dispatchEvent(new Event('alchemy:world-layout'));}
    return true;
  }
  window.AlchemyWorldLayout={objects,mouth,firebox,fit,get mobile(){return innerWidth<=650;}};
})();
