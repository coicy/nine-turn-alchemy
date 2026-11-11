(() => {
 const api=window.AlchemyGame,UX=window.AlchemyUX,observation=document.querySelector('.room-observation'),runes=document.getElementById('roomRunes');
 const details=document.createElement('details');details.className='observation-details';details.innerHTML='<summary>查看丹药</summary>';observation.append(details);
 const panel=document.createElement('section');panel.className='pill-detail-panel';panel.setAttribute('aria-label','丹药详情');document.querySelector('.game-layout').append(panel);window.AlchemyViewState.register('pill',panel,{short:true});
 details.querySelector('summary').onclick=e=>{e.preventDefault();window.AlchemyViewState.navigate('pill',{anchor:document.querySelector('.observation-pill')});};
 panel.addEventListener('click',e=>{if(e.target.closest('[data-close-pill]'))window.AlchemyViewState.close();});
 // Action guidance is attached to the real objects by furnace-guidance.js.
 function instruction(){return '';}
 function update(){const s=api.snapshot();
  document.body.classList.remove('guided-journey','guided-opening','journey-orders','journey-shop','journey-tools');
  const nature={warm:'温性',cool:'寒性',neutral:'平性'}[s.order?.nature]||'平性';
  UX.html(panel,'<header><h2>丹药</h2><button data-close-pill data-focus-key="close-pill">合上 ×</button></header><div class="pill-observe-art">'+UX.art(s)+'</div><p>'+s.turn+'转 · '+['凡品','良品','上品','极品','绝品'][s.quality]+' · '+nature+' · 药力 '+Math.round(s.value)+'</p><div class="pill-rune-details">'+(s.runes.length?s.runes.map(name=>'<article>'+UX.runeArt(name)+'<div><strong>'+name+' · '+s.runeLevels[name]+'阶</strong><p>'+UX.esc(api.RUNE_DEFS[name])+'</p></div></article>').join(''):'<p>尚未显纹</p>')+'</div>');
  runes.hidden=true;details.hidden=s.pillEnded||s.roundEnded;
  const hint=document.getElementById('workInstruction');if(hint){hint.textContent=UX.instruction(s,window.AlchemyScene2D?.held);hint.hidden=!hint.textContent;}window.dispatchEvent(new Event('alchemy:ux-layout'));
 }
 window.AlchemyOnboarding={instruction};window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);update();
})();
