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
