(() => {
 const drawer=document.getElementById('equipmentDrawer'),board=document.querySelector('.counter-board');
 const ids=['seal',null,'ward','stone','lucky','chain','repair','phoenix','breath_pearl','guard_casket','still_incense','hearth_pin','cooling_tag','quiet_lamp','pulse_ring','steady_talisman','slow_plate','pressure_plate','red_nail','fissure_cone','reverse_lamp','scorch_seal','ignite_pearl','risk_ruler','ash_contract','crack_bowl','reverse_fire','broken_link','scar_ruler','ash_box','ember_tray','failed_contract','pattern_tray','market_tag','medicine_seal','余料囊','consign牌','craft_mold','material_scale','client_contract','stock_talisman'];
  function decorateTool(el,id){const i=ids.indexOf(id);if(i<0)return null;el.classList.add('tool-art');el.setAttribute('aria-hidden','true');const sprite=i%8;el.style.backgroundPosition=`${(sprite%6)*20}% ${Math.floor(sprite/6)*50}%`;return el;}
 function icon(id){return decorateTool(document.createElement('i'),id);}
 window.AlchemyDecorateTool=decorateTool;
 function decorate(){
  drawer.querySelectorAll('.equipment-slot[data-equipment],.equipment-card').forEach(el=>{const id=el.dataset.equipment||el.querySelector('[data-equipment]')?.dataset.equipment;if(!el.querySelector('.tool-art')){const art=icon(id);if(art)el.prepend(art);}});

 }
 const waiting=document.createElement('div');waiting.className='counter-waiting';waiting.setAttribute('aria-label','候客');board.append(waiting);

 function queue(){const c=window.AlchemyGame.campaign();if(!c)return;const selected=board.querySelector('.counter-ticket.selected')?.dataset.letter,people=c.phase==='open'?window.AlchemyCustomers.waiting(c.orders,selected):[];const key=people.map(o=>o.id).join('|');if(waiting.dataset.key===key)return;waiting.dataset.key=key;waiting.replaceChildren();for(const o of people)waiting.append(window.AlchemyCustomerView.portrait(o,{waiting:true}));}
 new MutationObserver(decorate).observe(drawer,{childList:true,subtree:true});new MutationObserver(queue).observe(document.getElementById('counterVisitor'),{childList:true,subtree:true});window.addEventListener('alchemy:render',()=>{decorate();queue();});decorate();queue();
})();
