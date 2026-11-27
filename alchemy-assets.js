/* === Consolidated source: dialogue-opening.js === */
/* Three-room opening now runs on the same dialogue graph as all NPC conversations. */
(() => {
  'use strict';
  const start=document.getElementById('startButton');let pending=null;
  start.addEventListener('click',()=>{const step=window.AlchemySaves.preference('openingStep');pending=!start.textContent.includes('继续经营')?0:Number.isInteger(step)&&step>=0&&step<3?step:null;},true);
  start.addEventListener('click',()=>{
    if(!window.AlchemyGame.snapshot().started)return;
    const dialogue=window.AlchemyDialogue;
    if(dialogue.pending){dialogue.resumeConversation();pending=null;return;}
    if(pending!==null&&!dialogue.flags.openingComplete){const step=pending;pending=null;dialogue.openOpening(step);}
  });
  // The dialogue cursor owns progress; openingStep is only a legacy-save bridge.
  window.addEventListener('alchemy:dialogue-state',()=>{
    const dialogue=window.AlchemyDialogue,p=dialogue.present();
    if(!dialogue.active||p?.graph!=='opening')return;
    const stage=window.AlchemyDialogueContent.graphs.opening.nodes[p.node].stage;
    if(Number.isInteger(stage)&&window.AlchemySaves.preference('openingStep')!==stage)
      window.AlchemySaves.setPreference('openingStep',stage);
  });
  window.addEventListener('alchemy:dialogue-ended',e=>{if(e.detail.graph!=='opening')return;
    window.AlchemySaves.setPreference('openingStep',3);
    window.AlchemyViewState.navigate('work',{internal:true,workMode:e.detail.skipped?'room':'furnace'});
    window.dispatchEvent(new Event('alchemy:opening-finished'));
    requestAnimationFrame(()=>document.querySelector('.furnace-resume')?.focus({preventScroll:true}));
  });
  window.AlchemyOpening={get active(){return !!(window.AlchemyDialogue?.active&&window.AlchemyDialogue?.present()?.graph==='opening');},snapshot:()=>({active:window.AlchemyOpening.active,step:window.AlchemySaves.preference('openingStep')||0,finishing:false})};
})();
;
/* === Consolidated source: art-assets.js === */
(() => {
  const assets = [
    ['.herb-object > svg','assets/runtime/herb-parcel-v1.webp','raster-prop'],
    ['.tray-object > svg','assets/runtime/delivery-tray-v1.webp','raster-prop'],
    ['svg.hand-fan','assets/runtime/alchemy-fan-v1.webp','hand-fan raster-fan']
  ];
  for (const [selector,originalSource,classes] of assets) {
    const src=window.AlchemyWarmProps?.resolve(originalSource)||originalSource;
    const original=document.querySelector(selector);
    if (!original) continue;
    const image=new Image(); image.className=classes; image.alt=''; image.setAttribute('aria-hidden','true'); image.draggable=false;
    window.AlchemyAssets.load(src).then(ok=>{if(ok)original.replaceWith(image);});
    image.src=src;
  }
})();
;
/* === Consolidated source: alchemy-assets.js === */
(() => {
  // Use the same growth frame for the furnace and tray.
  const target=document.getElementById('pillVisual');
  let last='';
  function updateSurface(){
    const s=window.AlchemyGame?.snapshot();if(!s||!target)return;
    const d=window.AlchemyPillArt.describe(s);
    if(last!==d.key||!target.querySelector('.layered-pill-art')){
      last=d.key;target.querySelectorAll('.layered-pill-art').forEach(el=>el.remove());
      const wrap=document.createElement('span');wrap.className='layered-pill-art';
      const im=document.createElement('img');im.src=window.AlchemyPillArt.image(s);im.alt='';im.draggable=false;wrap.append(im);target.prepend(wrap);
      target.classList.add('layered-game-pill','raster-pill');target.dataset.nature=d.nature;
    }
    const label=document.getElementById('natureValue');if(label)label.textContent=s.pillEnded?'—':({warm:'温性',cool:'寒性',neutral:'平性'}[d.nature]||'平性');
    document.querySelectorAll('#trayPills i').forEach(node=>{
      const state={appearance:node.dataset.appearance,nature:node.dataset.nature,quality:Number(node.dataset.quality),turn:Number(node.dataset.turn)||1};
      const next=window.AlchemyPillArt.describe(state).key;if(node.dataset.artKey===next)return;node.dataset.artKey=next;node.classList.add('layered-tray-pill');
      const im=document.createElement('img');im.src=window.AlchemyPillArt.image(state);im.alt='';im.style.cssText='width:100%;height:100%';node.replaceChildren(im);
    });
  }
  const oldFurnace=document.querySelector('.furnace');
  if(oldFurnace&&!window.AlchemyWarmStyle)window.AlchemyAssets.load('assets/runtime/furnace-v1.webp').then(ok=>{if(ok){oldFurnace.style.backgroundImage='url("assets/runtime/furnace-v1.webp")';oldFurnace.classList.add('raster-furnace');}});
  window.addEventListener('alchemy:render',updateSurface);
  window.addEventListener('alchemy:pill-art-ready', () => {
    last = '';
    document.querySelectorAll('#trayPills i').forEach(node => delete node.dataset.artKey);
    updateSurface();
  });
  const trayTarget=document.getElementById('trayPills');if(trayTarget)new MutationObserver(updateSurface).observe(trayTarget,{childList:true});
  updateSurface();

})();
