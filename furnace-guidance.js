/* First-use cues follow actual actions. Only presentation preferences are saved. */
(() => {
  'use strict';
  const game=window.AlchemyGame,route=window.AlchemyViewState,layout=window.AlchemyWorldLayout;
  const stage=document.getElementById('pillStage');
  const cue=document.createElement('div');
  cue.className='furnace-action-cue';cue.hidden=true;
  cue.innerHTML='<span id="furnaceActionHint" role="status"></span>';
  stage.append(cue);
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
    cue.hidden=true;
    toggle.textContent=enabled?'关闭操作指引':'开启操作指引';
    if(v.current!=='work'||window.AlchemyOpening?.active||!s.started||s.busy||window.AlchemyScene2D.busy)return;
    const near=v.workMode==='furnace',live=!s.pillEnded&&!s.roundEnded;
    let target=null,rect=null,text='';
    if(held==='pill'){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text='收丹入库';
    }else if(held==='herbs'){
      target=document.getElementById('alchemyScene');rect=layout.mouth;text='投入炉口';
    }else if(!enabled)return;
    else if(s.runeChoices?.length)return;
    else if(near&&live&&!flags.refine&&s.turn<100){
      target=document.querySelector('.furnace-fire');rect=layout.firebox;text='点火门催炼';
    }else if(near&&live&&!flags.collect){
      target=document.querySelector('.furnace-tray');rect=layout.objects.tray;text='收丹入库';
    }else if(near&&s.pillEnded&&['collect','explode'].includes(s.endReason)&&!flags.leave){
      // The receipt already names the next step; highlight its real action only.
      target=document.querySelector('#roomSettlement [data-primary]');text='';
      if(target?.checkVisibility())rect=screenRect(target);
    }else if(!near&&s.pillEnded&&!flags.take){
      target=[...document.querySelectorAll('.herb-slot[aria-disabled=false]')].find(el=>el.checkVisibility());
      if(target){rect=screenRect(target);text='取一包药';}
    }
    if(!rect||!target)return;
    cue.hidden=false;cue.dataset.kind=held||'first-use';
    for(const [name,key]of [['left','x'],['top','y'],['width','w'],['height','h']])cue.style[name]=rect[key]+'px';
    cue.querySelector('span').textContent=text;cue.querySelector('span').hidden=!text;
    if(text){target.setAttribute('aria-describedby','furnaceActionHint');described=target;}
  }
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(render);}
  function closeSettings(){const b=document.querySelector('.world-settings-toggle');if(b?.getAttribute('aria-expanded')==='true')b.click();}
  const settings=document.getElementById('worldSettings'),toggle=document.createElement('button'),restart=document.createElement('button');
  toggle.type=restart.type='button';toggle.dataset.focusKey='toggle-furnace-guide';restart.dataset.focusKey='restart-furnace-guide';
  restart.textContent='重新查看操作指引';settings.append(toggle,restart);
  toggle.onclick=()=>{enabled=!enabled;save();closeSettings();schedule();};
  restart.onclick=()=>{flags={};enabled=true;save();closeSettings();schedule();};
  window.addEventListener('alchemy:carry',e=>{if(e.detail.kind==='herbs')done('take');schedule();});
  window.addEventListener('alchemy:world-collect',()=>{done('collect');schedule();});
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
    if(previous.runeChoices?.length&&!s.runeChoices?.length&&!s.pillEnded)done('choose');
    previous=s;schedule();
  });
  for(const name of ['alchemy:interaction','alchemy:world-layout','alchemy:opening-finished','resize'])window.addEventListener(name,schedule);
  window.AlchemyFurnaceGuidance={refresh:schedule,get enabled(){return enabled;}};
  render();
})();
