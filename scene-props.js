(() => {
 const E=window.AlchemyEconomy,market=document.querySelector('.economy-board'),drawer=document.getElementById('equipmentDrawer'),board=document.querySelector('.counter-board');
 const ids=['seal','needle','ward','stone','lucky','chain','repair','phoenix','burn','return','ash','fusion','six','guide_red','guide_blue','guide_moon','guide_thunder'];
 function icon(id){const i=ids.indexOf(id);if(i<0)return null;const el=document.createElement('i');el.className='tool-art';el.setAttribute('aria-hidden','true');el.style.backgroundPosition=`${(i%6)*20}% ${Math.floor(i/6)*50}%`;return el;}
 function decorate(){market.querySelectorAll('[data-inspect]').forEach(b=>{if(!b.querySelector('.tool-art')){const art=icon(b.dataset.inspect);if(art)b.prepend(art);}});
  const selected=market.querySelector('[data-inspect][aria-pressed=true]'),details=market.querySelector('.market-description');if(selected&&details&&!details.querySelector('.tool-art'))details.prepend(icon(selected.dataset.inspect));
  drawer.querySelectorAll('.equipment-slot[data-equipment],.equipment-card').forEach(el=>{const id=el.dataset.equipment||el.querySelector('[data-equipment]')?.dataset.equipment;if(!el.querySelector('.tool-art')){const art=icon(id);if(art)el.prepend(art);}});
  if(!market.querySelector('.market-merchant')){const img=document.createElement('img');img.className='market-merchant';img.src='assets/scene-props-v42/merchant.webp';img.alt='坊市掌柜';market.append(img);}
 }
 const waiting=document.createElement('div');waiting.className='counter-waiting';waiting.setAttribute('aria-label','候客');board.append(waiting);

 function queue(){const c=window.AlchemyGame.campaign();if(!c)return;const selected=board.querySelector('.counter-ticket.selected')?.dataset.letter,people=c.phase==='open'?window.AlchemyCustomers.waiting(c.orders,selected):[];const key=people.map(o=>o.id).join('|');if(waiting.dataset.key===key)return;waiting.dataset.key=key;waiting.replaceChildren();for(const o of people)waiting.append(window.AlchemyCustomerView.portrait(o,{waiting:true}));}
 new MutationObserver(decorate).observe(market,{childList:true,subtree:true});new MutationObserver(decorate).observe(drawer,{childList:true,subtree:true});new MutationObserver(queue).observe(document.getElementById('counterVisitor'),{childList:true,subtree:true});window.addEventListener('alchemy:render',()=>{decorate();queue();});decorate();queue();
})();
