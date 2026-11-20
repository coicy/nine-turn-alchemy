/* First-use cues follow actual actions. Only presentation preferences are saved. */
(() => {
  'use strict';
  const game=window.AlchemyGame,route=window.AlchemyViewState,layout=window.AlchemyWorldLayout;
  const stage=document.getElementById('pillStage');
  // Re-light the original painting through an object-shaped mask. Never draw a hit box.
  const ns='http://www.w3.org/2000/svg';
  const svg=(tag,attrs={})=>{const el=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))el.setAttribute(k,v);return el;};
  const light=svg('svg',{'aria-hidden':'true',class:'furnace-object-light',preserveAspectRatio:'none'});
  const defs=svg('defs'),mask=svg('mask',{id:'furnace-object-mask',maskUnits:'userSpaceOnUse'});
  const filter=svg('filter',{id:'furnace-object-feather',x:'-20%',y:'-20%',width:'140%',height:'140%'});
  const blur=svg('feGaussianBlur',{stdDeviation:'2'});filter.append(blur);
  const shape=svg('path',{fill:'white',filter:'url(#furnace-object-feather)'});
  mask.append(shape);defs.append(filter,mask);
  const painting=svg('image',{mask:'url(#furnace-object-mask)',preserveAspectRatio:'none'});
  light.append(defs,painting);stage.append(light);light.style.display='none';
  let lit=null;
  function clearLight(){if(lit)lit.classList.remove('object-guide-lit');lit=null;light.style.display='none';}
  function illuminate(target,kind){
    if(!['mouth','fire'].includes(kind)){lit=target.querySelector('img')||target;lit.classList.add('object-guide-lit');return;}
    // The living fire is above the painted light; brighten the flame itself too.
    if(kind==='fire'){
      lit=document.getElementById('furnaceLivingFire');
      lit?.classList.add('object-guide-lit');
    }
    const key=(route.snapshot().workMode==='furnace'?'furnace':'room')+'-'+(innerWidth<=650?'mobile':'desktop');
    const p=window.AlchemySceneProjection?.[key];if(!p)return;
    const r=p[kind],x=r.x*p.width,y=r.y*p.height,w=r.w*p.width,h=r.h*p.height;
    light.setAttribute('viewBox',`0 0 ${p.width} ${p.height}`);
    for(const el of [painting,mask]){el.setAttribute('width',p.width);el.setAttribute('height',p.height);}
    painting.setAttribute('href',stage.dataset.sceneImage||window.AlchemySceneLidLayer.baseImage(key));
    blur.setAttribute('stdDeviation',Math.max(1,w*.025));
    shape.setAttribute('d',kind==='mouth'
      ?`M${x} ${y+h/2} a${w/2} ${h/2} 0 1 0 ${w} 0 a${w/2} ${h/2} 0 1 0 ${-w} 0`
      :`M${x+w*.08} ${y+h} L${x+w*.08} ${y+h*.43} Q${x+w*.15} ${y} ${x+w*.5} ${y} Q${x+w*.88} ${y} ${x+w*.92} ${y+h*.43} L${x+w*.92} ${y+h} Z`);
    light.dataset.object=kind;light.style.display='';
  }
  const preference='tutorial-furnace-v105';
  const saved=window.AlchemySaves.preference(preference)||{};
  let flags={...saved.done},enabled=saved.enabled!==false,previous=game.snapshot(),previousView=route.snapshot(),described=null,queued=false;
  const save=()=>window.AlchemySaves.setPreference(preference,{enabled,done:flags});
  function done(name){if(flags[name])return;flags[name]=true;save();}
  function screenRect(el){
    const a=el.getBoundingClientRect(),b=stage.getBoundingClientRect();
    return{x:(a.x-b.x)*stage.clientWidth/b.width,y:(a.y-b.y)*stage.clientHeight/b.height,w:a.width*stage.clientWidth/b.width,h:a.height*stage.clientHeight/b.height};
  }
  function render(){
    queued=false;
    const s=game.snapshot(),v=route.snapshot(),held=window.AlchemyScene2D.held;
    if(described){described.removeAttribute('aria-describedby');described=null;}
    clearLight();
    toggle.textContent=enabled?'关闭操作指引':'开启操作指引';
    if(v.current!=='work'||window.AlchemyOpening?.active||!s.started||s.ritualActive||s.busy||window.AlchemyScene2D.busy){window.AlchemyFeedback.setGuide('');return;}
    const near=v.workMode==='furnace',live=!s.pillEnded&&!s.roundEnded;
    let target=null,rect=null,text='';
    if(held==='pill'){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text='收丹入匣';
    }else if(held==='herbs'){
      target=document.getElementById('alchemyScene');rect=layout.mouth;text='投入炉口';
    }else if(near&&live&&s.turn>=100){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text='百转成丹，点击收丹。';
    }else if(!enabled){window.AlchemyFeedback.setGuide('');return;}

    else if(near&&live&&!flags.refine&&s.turn<100){
      target=document.querySelector('.furnace-fire');rect=layout.firebox;text='点火门催炼';
    }else if(near&&s.pillEnded&&['collect','explode'].includes(s.endReason)&&!flags.leave){
      // The receipt already names the next step; highlight its real action only.
      target=document.querySelector('#roomSettlement [data-primary]');text='';
      if(target?.checkVisibility())rect=screenRect(target);
    }else if(near&&s.pillEnded&&!flags.take){
      target=[...document.querySelectorAll('.herb-slot[aria-disabled=false]')].find(el=>el.checkVisibility());
      if(target){rect=screenRect(target);text='取一包药';}
    }
    if(!rect||!target){window.AlchemyFeedback.setGuide('');return;}
    illuminate(target,held==='herbs'?'mouth':target.matches('.furnace-fire')?'fire':'control');
    window.AlchemyFeedback.setGuide(text);
    if(text){target.setAttribute('aria-describedby','refineFeedback');described=target;}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}
  function closeSettings(){const b=document.querySelector('.world-settings-toggle');if(b?.getAttribute('aria-expanded')==='true')b.click();}
  const settings=document.getElementById('worldSettings'),toggle=document.createElement('button'),restart=document.createElement('button');
  toggle.type=restart.type='button';toggle.dataset.focusKey='toggle-furnace-guide';restart.dataset.focusKey='restart-furnace-guide';
  restart.textContent='重新查看操作指引';settings.append(toggle,restart);
  toggle.onclick=()=>{enabled=!enabled;save();closeSettings();schedule();};
  restart.onclick=()=>{flags={};enabled=true;save();closeSettings();schedule();};
  window.addEventListener('alchemy:carry',e=>{if(e.detail.kind==='herbs')done('take');schedule();});
  window.addEventListener('alchemy:refine-result',()=>{done('refine');schedule();});
  window.addEventListener('alchemy:furnace-leave',()=>{if(game.snapshot().pillEnded)done('leave');schedule();});
  window.addEventListener('alchemy:view-ready',()=>{
    const v=route.snapshot();
    if(previousView.location==='work'&&previousView.workMode==='furnace'&&game.snapshot().pillEnded&&(v.location!=='work'||v.workMode!=='furnace'))done('leave');
    previousView=v;schedule();
  });
  window.addEventListener('alchemy:render',()=>{
    const s=game.snapshot();
    if(previous.started&&previous.pillEnded&&!s.pillEnded)done('load');
    previous=s;schedule();
  });
  for(const name of ['alchemy:interaction','alchemy:world-layout','alchemy:opening-finished','resize'])window.addEventListener(name,schedule);
  window.AlchemyFurnaceGuidance={refresh:schedule,get enabled(){return enabled;}};
  render();
})();
