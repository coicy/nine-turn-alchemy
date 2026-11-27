/* Visual backing only: measure existing controls without moving their hit regions. */
(() => {
 'use strict';
 const judgment=document.querySelector('.furnace-judgment'),collect=document.querySelector('.furnace-tray'),viewport=document.querySelector('.engine-viewport'),stock=document.querySelector('.herb-tray');
 if(!judgment||!collect||!viewport)return;
 document.body.classList.add('furnace-solid-surface');
 const backing=document.createElement('div');backing.className='furnace-surface-backing';backing.setAttribute('aria-hidden','true');backing.hidden=true;judgment.before(backing);
 let queued=false;
 function update(){
  queued=false;
  if(judgment.hidden||collect.hidden||viewport.dataset.rite==='trace'||document.body.dataset.mobileFurnaceDock==='true'||document.body.dataset.desktopFurnaceCard==='true'){backing.hidden=true;return;}
  const j=judgment.getBoundingClientRect(),c=collect.getBoundingClientRect(),v=viewport.getBoundingClientRect(),s=stock?.getBoundingClientRect();
  if(!j.width||!c.height){backing.hidden=true;return;}
  const leftPad=Math.max(0,Math.min(12,j.left-v.left-3)),rightPad=Math.max(0,Math.min(12,v.right-j.right-3));
  const bottomEdge=Math.max(j.bottom,c.bottom);
  const bottomPad=Math.max(2,Math.min(10,(s?.height?s.top:v.bottom)-bottomEdge-4));
  const box={left:(j.left-v.left-leftPad)+'px',top:(j.top-v.top-12)+'px',width:(j.width+leftPad+rightPad)+'px',height:(bottomEdge-j.top+12+bottomPad)+'px'};
  backing.hidden=false;
  for(const [k,val]of Object.entries(box))if(backing.style[k]!==val)backing.style[k]=val;
 }
 const schedule=()=>{if(queued)return;queued=true;requestAnimationFrame(update);};
 for(const event of ['alchemy:render','alchemy:assets-ready','alchemy:world-layout','alchemy:ux-layout','alchemy:interaction','alchemy:carry','alchemy:view-ready','resize'])window.addEventListener(event,schedule);
 const observer=new ResizeObserver(schedule);for(const el of [judgment,collect,viewport,stock].filter(Boolean))observer.observe(el);
 schedule();
})();
