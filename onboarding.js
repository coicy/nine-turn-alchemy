(() => {
 const api=window.AlchemyGame,UX=window.AlchemyUX,observation=document.querySelector('.room-observation');
 const details=document.createElement('details');details.className='observation-details';details.innerHTML='<summary>查看丹药</summary>';observation.append(details);
 const panel=document.createElement('section');panel.className='pill-detail-panel';panel.setAttribute('aria-label','丹药详情');document.querySelector('.game-layout').append(panel);window.AlchemyViewState.register('pill',panel,{short:true});
 details.querySelector('summary').onclick=e=>{e.preventDefault();window.AlchemyViewState.navigate('pill',{anchor:document.querySelector('.observation-pill')});};
 panel.addEventListener('click',e=>{if(e.target.closest('[data-close-pill]'))window.AlchemyViewState.close();});
 // Action guidance is attached to the real objects by furnace-guidance.js.
 function instruction(){return '';}
 function update(){const s=api.snapshot();
  document.body.classList.remove('guided-journey','guided-opening','journey-orders','journey-shop','journey-tools');
  const rawNature=window.AlchemyPillArt?.describe?window.AlchemyPillArt.describe(s).nature:s.nature;const nature={warm:'温性',cool:'寒性',neutral:'平性'}[rawNature||s.nature]||'平性';const potency=Number.isFinite(s.grossValue)?s.grossValue:Math.round(s.value+(s.yuanBonus||0));
  UX.html(panel,'<header><h2>'+(s.craftKind?window.AlchemyCrafts.name(s):'丹药')+'</h2><button data-close-pill data-focus-key="close-pill">合上 ×</button></header><div class="pill-observe-art">'+UX.art(s)+'</div><p>'+s.turn+'转 · '+(s.craftKind?'自购器料 · 估值 ':['凡品','良品','上品','极品','绝品'][s.quality]+' · '+nature+' · 药力 ')+potency+((!s.craftKind&&(s.yuanBonus||0)>0)?'（含归元 +'+Math.round(s.yuanBonus)+'）':'')+'</p>');
  details.hidden=s.pillEnded||s.roundEnded;
  const hint=document.getElementById('workInstruction');if(hint){hint.textContent=UX.instruction(s,window.AlchemyScene2D?.held);hint.hidden=!hint.textContent;}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 window.AlchemyOnboarding={instruction};window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);update();
})();
