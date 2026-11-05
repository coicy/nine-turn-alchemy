(() => {
  // The V103 renderer owns the body, growth and all rune projections.
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
    document.getElementById('pillStage')?.classList.add('surface-runes');
    const label=document.getElementById('natureValue');if(label)label.textContent=s.pillEnded?'—':({warm:'温性 · 熟褐',cool:'寒性 · 青灰',neutral:'平性 · 草赭'}[d.nature]||'平性 · 草赭');
    document.querySelectorAll('#trayPills i').forEach(node=>{
      const state={nature:node.dataset.nature,quality:Number(node.dataset.quality),turn:Number(node.dataset.turn)||1,runes:(node.dataset.runes||'').split(',').filter(Boolean)};
      const next=window.AlchemyPillArt.describe(state).key;if(node.dataset.artKey===next)return;node.dataset.artKey=next;node.classList.add('layered-tray-pill');
      const im=document.createElement('img');im.src=window.AlchemyPillArt.image(state);im.alt='';im.style.cssText='width:100%;height:100%';node.replaceChildren(im);
    });
  }
  const oldFurnace=document.querySelector('.furnace');
  if(oldFurnace)window.AlchemyAssets.load('assets/runtime-v10/furnace-v1.webp').then(ok=>{if(ok){oldFurnace.style.backgroundImage='url("assets/runtime-v10/furnace-v1.webp")';oldFurnace.classList.add('raster-furnace');}});
  window.addEventListener('alchemy:render',updateSurface);
  window.addEventListener('alchemy:assets-ready',()=>{last='';updateSurface();});
  const trayTarget=document.getElementById('trayPills');if(trayTarget)new MutationObserver(updateSurface).observe(trayTarget,{childList:true});
  updateSurface();

})();
