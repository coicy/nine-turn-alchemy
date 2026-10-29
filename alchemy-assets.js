(() => {
  const pill=document.getElementById('pillVisual'), furnace=document.querySelector('.furnace');
  const root='assets/runtime-v10/';
  const bodies={warm:'color-04-brown',cool:'color-07-slate',neutral:'color-06-olive'};
  const patterns={'赤纹':'crack-01-single','青纹':'crack-02-fork','月纹':'crack-04-arc','雷纹':'crack-06-traverse','金纹':'crack-03-opposed','星痕':'crack-05-fragments'};
  const hues=['#D5DEE1','#91B78B','#74A9D4','#B091CC','#DFB87C'];
  const cache=new Map();let revision=0,lastKey='';
  function load(src){if(window.AlchemyAssets)return window.AlchemyAssets.load(src);if(!cache.has(src))cache.set(src,new Promise(resolve=>{const im=new Image();im.onload=()=>resolve(true);im.onerror=()=>resolve(false);im.src=src;}));return cache.get(src);}
  function layer(body,cracks,q){const wrap=document.createElement('span');wrap.className='layered-pill-art';
    const base=document.createElement('img');base.src=body;base.alt='';base.draggable=false;wrap.append(base);
    for(const crack of cracks){const marks=document.createElement('span');marks.className='layered-pill-crack';marks.style.backgroundColor=hues[q];marks.style.maskImage=`url("${crack}")`;marks.style.webkitMaskImage=`url("${crack}")`;wrap.append(marks);}
    return wrap;}
  function selection(nature,quality,runes=[]){const q=Math.max(0,Math.min(4,Number(quality)||0));const body=root+(bodies[nature]||bodies.neutral)+'.webp';const cracks=runes.slice(0,6).map(rune=>root+(patterns[rune]||'crack-01-single')+'.webp');return {body,cracks,crack:cracks[cracks.length-1],q};}
  if(furnace)load('assets/runtime-v10/furnace-v1.webp').then(ok=>{if(ok){furnace.style.backgroundImage='url("assets/runtime-v10/furnace-v1.webp")';furnace.classList.add('raster-furnace');}});
  function tray(){document.querySelectorAll('#trayPills i').forEach(node=>{const a=selection(node.dataset.nature,node.dataset.quality,(node.dataset.runes||'').split(',').filter(Boolean));const key=JSON.stringify(a);if(node.dataset.artKey===key)return;node.dataset.artKey=key;node.classList.add('layered-tray-pill');node.replaceChildren(layer(a.body,a.cracks,a.q));});}
  async function update(){const s=window.AlchemyGame?.snapshot();if(!s||!pill)return;const token=++revision;const nature=s.order?.nature||'neutral';const a=selection(nature,s.quality,s.runes);const key=JSON.stringify(a);if(key===lastKey){const label=document.getElementById('natureValue');if(label)label.textContent=s.pillEnded?'—':({warm:'温性 · 熟褐',cool:'寒性 · 青灰',neutral:'平性 · 草赭'}[nature]||'平性 · 草赭');return;}const ready=await Promise.all([load(a.body),...a.cracks.map(load)]);if(token!==revision||!ready.every(Boolean))return;
    lastKey=key;pill.querySelectorAll('.layered-pill-art').forEach(n=>n.remove());pill.prepend(layer(a.body,a.cracks,a.q));pill.classList.add('layered-game-pill');pill.classList.add('raster-pill');pill.dataset.nature=nature;
    document.getElementById('pillStage')?.classList.add('surface-runes');const label=document.getElementById('natureValue');if(label)label.textContent=s.pillEnded?'—':({warm:'温性 · 熟褐',cool:'寒性 · 青灰',neutral:'平性 · 草赭'}[nature]||'平性 · 草赭');tray();}
  window.AlchemyPillArt={selection,patterns,hues};window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:assets-ready',update);
  if(typeof MutationObserver!=='undefined'){const target=document.getElementById('trayPills');if(target)new MutationObserver(tray).observe(target,{childList:true});}
  update();
})();
