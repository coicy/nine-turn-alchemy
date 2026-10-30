(() => {
 const E=window.AlchemyEconomy,market=document.querySelector('.economy-board'),drawer=document.getElementById('equipmentDrawer'),board=document.querySelector('.counter-board');
 const ids=['seal','needle','ward','stone','lucky','chain','repair','phoenix','burn','return','ash','fusion','six','guide_red','guide_blue','guide_moon','guide_thunder'];
 function icon(id){const i=ids.indexOf(id);if(i<0)return null;const el=document.createElement('i');el.className='tool-art';el.setAttribute('aria-hidden','true');el.style.backgroundPosition=`${(i%6)*20}% ${Math.floor(i/6)*50}%`;return el;}
 function decorate(){market.querySelectorAll('[data-inspect]').forEach(b=>{if(!b.querySelector('.tool-art')){const art=icon(b.dataset.inspect);if(art)b.prepend(art);}});
  const selected=market.querySelector('[data-inspect][aria-pressed=true]'),details=market.querySelector('.market-description');if(selected&&details&&!details.querySelector('.tool-art'))details.prepend(icon(selected.dataset.inspect));
  drawer.querySelectorAll('.equipment-slot[data-equipment],.equipment-card').forEach(el=>{const id=el.dataset.equipment||el.querySelector('[data-equipment]')?.dataset.equipment;if(!el.querySelector('.tool-art')){const art=icon(id);if(art)el.prepend(art);}});
  if(!market.querySelector('.market-merchant')){const img=document.createElement('img');img.className='market-merchant';img.src='assets/scene-props-v42/merchant.png';img.alt='坊市掌柜';market.append(img);}
 }
 const waiting=document.createElement('div');waiting.className='counter-waiting';waiting.setAttribute('aria-label','候客');board.append(waiting);
 const types={'坊市行商':0,'驿路信使':0,'渡口船客':0,'远行修士':1,'守夜修士':1,'游学弟子':1,'闭关散修':1,'探洞修士':1,'采药散修':2,'山间药农':2};
 function queue(){const c=window.AlchemyGame.campaign();if(!c)return;const selected=board.querySelector('.counter-ticket.selected')?.dataset.letter;const people=c.phase==='open'?c.orders.filter(o=>o.status==='pending'&&o.id!==selected).slice(0,2):[];const key=people.map(o=>o.id).join('|');if(waiting.dataset.key===key)return;waiting.dataset.key=key;waiting.replaceChildren();for(const o of people){const el=document.createElement('div');el.className='waiting-person';el.style.backgroundPosition=`${(types[o.client]||0)*50}% center`;el.title=o.client+' · 候客';el.setAttribute('role','img');el.setAttribute('aria-label',o.client+'等待接待');waiting.append(el);}}
 new MutationObserver(decorate).observe(market,{childList:true,subtree:true});new MutationObserver(decorate).observe(drawer,{childList:true,subtree:true});new MutationObserver(queue).observe(document.getElementById('counterVisitor'),{childList:true,subtree:true});window.addEventListener('alchemy:render',()=>{decorate();queue();});decorate();queue();
})();
