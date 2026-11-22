(() => {
  'use strict';
  const note=document.getElementById('counterNote'),letter=document.getElementById('counterLetter');
  if(!note||!letter)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),running=new Map();
  let lastNote=false,lastLetter=false,frame=0,disposed=false;
  function motion(el,frames,duration){
    running.get(el)?.cancel();running.delete(el);
    if(!window.AlchemyOpening?.active||reduced.matches||document.hidden||!el.animate)return;
    const a=el.animate(frames,{duration,easing:'cubic-bezier(.18,.75,.25,1)',fill:'none'});running.set(el,a);
    a.finished.then(()=>{if(running.get(el)===a)running.delete(el);}).catch(()=>{});
  }
  function clear(){for(const a of running.values())a.cancel();running.clear();}
  function visible(el){return !el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';}
  function update(){
    frame=0;if(disposed)return;
    const board=document.querySelector('.counter-board');
    const inCounter=board?.dataset.shellActive==='true'&&window.AlchemyViewState?.snapshot().phase==='idle';
    const n=inCounter&&visible(note),l=inCounter&&visible(letter);
    if(n&&!lastNote&&!l&&note.dataset.noteArt==='image')motion(note,[{opacity:0,translate:'0 -14px',rotate:'-2deg'},{opacity:1,translate:'0 1px',rotate:'.3deg',offset:.78},{opacity:1,translate:'0 0',rotate:'0deg'}],320);
    if(l&&!lastLetter)motion(letter,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 -1px',offset:.82},{opacity:1,translate:'0 0'}],240);
    if(!l&&lastLetter&&n)motion(note,[{opacity:.3,translate:'0 -3px'},{opacity:1,translate:'0 0'}],160);
    lastNote=n;lastLetter=l;
    if(!inCounter){running.get(note)?.cancel();running.get(letter)?.cancel();}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  const observer=new MutationObserver(schedule);
  observer.observe(note,{attributes:true,attributeFilter:['hidden','aria-expanded','data-note-art']});
  observer.observe(letter,{attributes:true,attributeFilter:['hidden'],childList:true});
  for(const event of ['resize','alchemy:view-ready'])window.addEventListener(event,schedule);
  window.addEventListener('alchemy:opening-finished',()=>{clear();schedule();});
  document.addEventListener('visibilitychange',()=>{clear();schedule();});
  reduced.addEventListener('change',()=>{clear();schedule();});
  window.addEventListener('pagehide',()=>{disposed=true;clear();cancelAnimationFrame(frame);observer.disconnect();});
  window.AlchemyCommissionMotion={snapshot:()=>({active:running.size,reduced:reduced.matches})};schedule();
})();
