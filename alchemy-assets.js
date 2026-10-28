(() => {
  const base='assets/alchemy/', furnace=document.querySelector('.furnace'), pill=document.getElementById('pillVisual');
  const qualityFiles=['common','fine','superior','premium','perfect'];
  const ready=new Set();let layers=null;
  function preload(file,callback,extension='.png'){const image=new Image();image.onload=()=>callback(image);image.src=base+file+extension;}
  if(furnace)preload('furnace-v1',()=>{furnace.style.backgroundImage=`url("${base}furnace-v1.png")`;furnace.classList.add('raster-furnace');});
  if(pill)preload('pill-base-v1',image=>{
    image.className='pill-texture';image.alt='';image.draggable=false;image.setAttribute('aria-hidden','true');pill.prepend(image);
    layers=document.createElement('div');layers.className='pill-rune-layers';layers.setAttribute('aria-hidden','true');pill.append(layers);pill.classList.add('raster-pill');document.getElementById('pillStage').classList.add('surface-runes');update();
  });
  function update(){
    const s=window.AlchemyGame?.snapshot();if(!s||!pill)return;
    const quality=Math.max(0,Math.min(4,s.quality||0)), file=qualityFiles[quality];
    const nature=s.order?.nature||'neutral';pill.dataset.nature=['warm','cool','neutral'].includes(nature)?nature:'neutral';
    if(layers){layers.replaceChildren();if(ready.has(file)&&(quality>0||(s.runes||[]).length)){
      const image=new Image();image.src=base+'pill-cracks-'+file+'-v3.svg';image.alt='';image.draggable=false;image.className='pill-rune-sprite quality-cracks';layers.append(image);
    }}
    const natureLabel=document.getElementById('natureValue');
    if(natureLabel)natureLabel.textContent=s.pillEnded?'—':({warm:'温性 · 暖赭',cool:'寒性 · 冷蓝',neutral:'平性 · 青绿'}[pill.dataset.nature]);
    document.querySelectorAll('.rune-entry .rune-dot').forEach(dot=>{dot.style.background='#c8c6b2';});
  }
  for(const file of qualityFiles)preload('pill-cracks-'+file+'-v3',()=>{ready.add(file);update();},'.svg');
  window.addEventListener('alchemy:render',update);update();
})();
