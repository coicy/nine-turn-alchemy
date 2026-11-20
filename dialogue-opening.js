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
  window.addEventListener('alchemy:dialogue-state',()=>{const p=window.AlchemyDialogue.present();if(window.AlchemyDialogue.active&&p?.graph==='opening')window.AlchemySaves.setPreference('openingStep',p.node==='room'||p.node==='lease'?0:p.node==='fire'?2:1);});
  window.addEventListener('alchemy:dialogue-ended',e=>{if(e.detail.graph!=='opening')return;
    window.AlchemySaves.setPreference('openingStep',3);
    window.AlchemyViewState.navigate('work',{internal:true,workMode:'room'});
    window.dispatchEvent(new Event('alchemy:opening-finished'));
    requestAnimationFrame(()=>document.querySelector('.furnace-resume')?.focus({preventScroll:true}));
  });
  window.AlchemyOpening={get active(){return !!(window.AlchemyDialogue?.active&&window.AlchemyDialogue?.present()?.graph==='opening');},snapshot:()=>({active:window.AlchemyOpening.active,step:window.AlchemySaves.preference('openingStep')||0,finishing:false})};
})();
