(() => {
  const base='assets/alchemy/';
  const furnace=document.querySelector('.furnace');
  const pill=document.getElementById('pillVisual');
  const runes={'赤纹':'rune-crimson-v1','青纹':'rune-azure-v1','月纹':'rune-moon-v1','雷纹':'rune-thunder-v1','金纹':'rune-gold-v1','星痕':'rune-star-v1'};
  const loaded=new Set();
  function preload(file,ready){const image=new Image();image.onload=()=>ready(image);image.src=base+file+'.png';}
  // Keep the original interactive SVG node: its click listener and drop bounds must survive.
  if(furnace)preload('furnace-v1',()=>{furnace.style.backgroundImage=`url("${base}furnace-v1.png")`;furnace.classList.add('raster-furnace');});
  let layers=null;
  if(pill)preload('pill-base-v1',image=>{
    image.className='pill-texture';image.alt='';image.draggable=false;image.setAttribute('aria-hidden','true');pill.prepend(image);
    layers=document.createElement('div');layers.className='pill-rune-layers';layers.setAttribute('aria-hidden','true');pill.append(layers);pill.classList.add('raster-pill');update();
  });
  function update(){
    const s=window.AlchemyGame?.snapshot();if(!s)return;
    if(layers){layers.replaceChildren();for(const name of s.runes||[]){if(!loaded.has(name))continue;const im=new Image();im.src=base+runes[name]+'.png';im.alt='';im.draggable=false;im.className='pill-rune-sprite';layers.append(im);}}
    document.querySelectorAll('.orbit-rune').forEach(node=>{
      const name=node.dataset.runeName||node.textContent;
      if(!loaded.has(name))return;
      node.dataset.runeName=name;node.setAttribute('title',name);node.classList.add('raster-orbit');node.style.backgroundImage=`url("${base+runes[name]}.png")`;
    });
    document.querySelectorAll('.rune-entry').forEach(entry=>{
      const name=entry.querySelector('strong')?.textContent,dot=entry.querySelector('.rune-dot');
      if(!dot||!loaded.has(name))return;
      dot.classList.add('raster-rune-dot');dot.style.backgroundImage=`url("${base+runes[name]}.png")`;
    });
  }
  for(const [name,file]of Object.entries(runes))preload(file,()=>{loaded.add(name);update();});
  window.addEventListener('alchemy:render',update);update();
})();
