(() => {
  const card=document.querySelector('.room-observation'),source=document.getElementById('pillVisual');
  card.querySelector('h2').textContent='观丹 · 炉内映像';
  const preview=document.createElement('div');preview.className='observation-pill layered-game-pill';preview.setAttribute('aria-hidden','true');card.querySelector('h2').after(preview);
  let key='';
  function sync(){const s=window.AlchemyGame.snapshot();card.dataset.busy=String(s.busy);const art=source.querySelector('.layered-pill-art');if(!art)return;const next=art.outerHTML;if(next!==key){key=next;preview.replaceChildren(art.cloneNode(true));}}
  new MutationObserver(sync).observe(source,{childList:true});
  window.addEventListener('alchemy:render',sync);window.addEventListener('alchemy:assets-ready',sync);sync();
})();
