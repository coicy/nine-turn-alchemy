/* Visual backing only: measure existing controls without moving their hit regions. */
(() => {
 'use strict';
 const judgment=document.querySelector('.furnace-judgment'),collect=document.querySelector('.furnace-tray'),viewport=document.querySelector('.engine-viewport'),stock=document.querySelector('.herb-tray');
 if(!judgment||!collect||!viewport)return;
 document.body.classList.add('furnace-solid-surface');
 let queued=false;
 function update(){
  queued=false;if(judgment.hidden||collect.hidden)return;
  const j=judgment.getBoundingClientRect(),c=collect.getBoundingClientRect(),v=viewport.getBoundingClientRect(),s=stock?.getBoundingClientRect();if(!j.width||!c.height)return;
  const left=Math.max(0,Math.min(12,j.left-v.left-3)),right=Math.max(0,Math.min(12,v.right-j.right-3));
  const bottomPad=Math.max(2,Math.min(10,(s?.height?s.top:v.bottom)-c.bottom-4));
  for(const [key,value]of Object.entries({'--surface-left':left,'--surface-right':right,'--surface-tail':Math.max(0,c.bottom-j.bottom)+bottomPad})){
   const next=value+'px';if(judgment.style.getPropertyValue(key)!==next)judgment.style.setProperty(key,next);
  }
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(update);};
 for(const event of ['alchemy:render','alchemy:assets-ready','alchemy:world-layout','alchemy:ux-layout','alchemy:interaction','alchemy:carry','alchemy:view-ready','resize'])window.addEventListener(event,schedule);
 const observer=new ResizeObserver(schedule);for(const el of [judgment,collect,viewport,stock].filter(Boolean))observer.observe(el);
 schedule();
})();
