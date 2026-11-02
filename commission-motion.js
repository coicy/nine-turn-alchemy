(() => {
  'use strict';
  const note=document.getElementById('counterNote'),letter=document.getElementById('counterLetter');
  if(!note||!letter)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),running=new Map();
  const cue=document.createElement('div');cue.className='commission-motion-cue';cue.textContent='点击纸笺 · 查看委托';cue.setAttribute('aria-hidden','true');cue.hidden=true;document.body.append(cue);
  let lastNote=false,lastLetter=false,lastStep='',lastCopy='',frame=0,disposed=false;
  function motion(el,frames,duration){
    running.get(el)?.cancel();running.delete(el);
    if(reduced.matches||document.hidden||!el.animate)return;
    const a=el.animate(frames,{duration,easing:'cubic-bezier(.18,.75,.25,1)',fill:'none'});running.set(el,a);
    a.finished.then(()=>{if(running.get(el)===a)running.delete(el);}).catch(()=>{});
  }
  function clear(){for(const a of running.values())a.cancel();running.clear();cue.hidden=true;}
  function visible(el){return !el.hidden&&el.getClientRects().length>0&&getComputedStyle(el).visibility!=='hidden';}
  function update(){
    frame=0;if(disposed)return;
    const board=document.querySelector('.counter-board');
    const inCounter=board?.dataset.shellActive==='true'&&window.AlchemyViewState?.snapshot().phase==='idle';
    const n=inCounter&&visible(note),l=inCounter&&visible(letter);
    if(n&&!lastNote&&!l)motion(note,[{opacity:0,translate:'0 -14px',rotate:'-2deg'},{opacity:1,translate:'0 1px',rotate:'.3deg',offset:.78},{opacity:1,translate:'0 0',rotate:'0deg'}],320);
    if(l&&!lastLetter)motion(letter,[{opacity:0,translate:'0 12px'},{opacity:1,translate:'0 -1px',offset:.82},{opacity:1,translate:'0 0'}],240);
    if(!l&&lastLetter&&n)motion(note,[{opacity:.3,translate:'0 -3px'},{opacity:1,translate:'0 0'}],160);
    lastNote=n;lastLetter=l;
    const opening=document.body.classList.contains('opening-in-scene'),step=document.body.dataset.openingStep||'';
    cue.hidden=!(opening&&step==='1'&&n&&!l);
    if(!cue.hidden){const r=note.getBoundingClientRect();cue.style.left=Math.max(10,Math.min(innerWidth-220,r.left+r.width/2-105))+'px';cue.style.top=Math.max(64,r.top-43)+'px';}
    if(opening&&step!==lastStep){const box=document.querySelector('.prologue-dialogue');if(box)motion(box,[{opacity:0,translate:'0 16px'},{opacity:1,translate:'0 0'}],300);}
    const copy=document.getElementById('prologueText');
    if(opening&&copy&&copy.textContent!==lastCopy&&step===lastStep)motion(copy,[{opacity:.4,translate:'0 4px'},{opacity:1,translate:'0 0'}],180);
    lastStep=opening?step:'';lastCopy=copy?.textContent||'';
    if(!inCounter){running.get(note)?.cancel();running.get(letter)?.cancel();}
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(update);}
  const observer=new MutationObserver(schedule);
  observer.observe(note,{attributes:true,attributeFilter:['hidden','aria-expanded']});
  observer.observe(letter,{attributes:true,attributeFilter:['hidden'],childList:true});
  observer.observe(document.body,{attributes:true,attributeFilter:['class','data-opening-step','data-view-phase']});
  const copy=document.getElementById('prologueText');if(copy)observer.observe(copy,{childList:true,characterData:true,subtree:true});
  for(const event of ['resize','alchemy:view-ready'])window.addEventListener(event,schedule);
  window.addEventListener('alchemy:opening-finished',()=>{clear();schedule();});
  document.addEventListener('visibilitychange',()=>{clear();schedule();});
  reduced.addEventListener('change',()=>{clear();schedule();});
  window.addEventListener('pagehide',()=>{disposed=true;clear();cancelAnimationFrame(frame);observer.disconnect();});
  window.AlchemyCommissionMotion={snapshot:()=>({active:running.size,cueVisible:!cue.hidden,reduced:reduced.matches})};schedule();
})();
