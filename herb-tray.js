(() => {
  const stage=document.getElementById('pillStage'),api=window.AlchemyGame;
  const panel=document.createElement('aside');panel.className='herb-tray';panel.setAttribute('aria-label','药匣槽');stage.append(panel);
  let rows=[],drag=null;
  function render(){if(drag)return;const s=api.snapshot(),c=api.campaign(),e=c?.economy;if(!e){panel.hidden=true;return;}panel.hidden=false;
    rows=[];if(s.order&&!s.roundEnded)rows.push({name:s.order.self?'本炉药包':s.order.name,count:s.remaining,source:s.order.self?'自有 · 已备料':'委托供料',current:true});
    ['普通药包','精选药包','灵性药包'].forEach((name,i)=>rows.push({name,count:e.stock[i],source:'自有',kind:'self',id:i}));
    [['neutral','平性余药'],['warm','温性余药'],['cool','寒性余药']].forEach(([id,name])=>{if(e.herbs[id])rows.push({name,count:e.herbs[id],source:'赠留 · 自有',kind:'herbself',id});});
    panel.innerHTML='<h2>备药匣</h2><p>从格中取药 · 一包一炉</p><div class="herb-slots">'+[...rows,...Array.from({length:Math.max(0,8-rows.length)},()=>({name:'空格',count:0,source:'',vacant:true}))].map((r,i)=>`<div class="herb-slot" ${r.vacant?'':`data-slot="${i}"`} title="${r.name} · ${r.source} · ${r.count}份" data-empty="${r.count===0}" aria-disabled="${!r.count||!s.pillEnded||s.busy||(!r.current&&!!s.order&&!s.roundEnded)}" tabindex="0" role="button" aria-label="${r.name}，${r.source}，${r.count}份"><img src="assets/runtime-v10/herb-parcel-v1.webp" alt="" draggable="false"><span><b>${r.name}</b><small>${r.source}</small></span><strong>${r.count?`${r.count}`:''}</strong></div>`).join('')+'</div><p id="herbTrayHint" role="status">'+(s.busy?'炼化中，暂不可取药':!s.pillEnded?'炉中有丹，收丹后取药':s.order&&!s.roundEnded?'当前优先使用本炉材料':'选用自有药包可开始自炼')+'</p>';
  }
  function take(index,e){const r=rows[index],s=api.snapshot();if(!r||!r.count||s.busy||!s.pillEnded||window.AlchemyInteractionBusy)return false;if(!r.current&&s.order&&!s.roundEnded){document.getElementById('herbTrayHint').textContent='先结清当前委托，再选用自有材料';return false;}if(!r.current&&!api.economyAction(r.kind,r.id,'neutral'))return false;return window.AlchemyScene2D.takeHerbs(e);}
  panel.addEventListener('pointerdown',e=>{const el=e.target.closest('[data-slot]');if(!el||e.button!==0)return;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};el.setPointerCapture(e.pointerId);if(!take(Number(el.dataset.slot),e)){drag=null;return;}e.preventDefault();});
  panel.addEventListener('pointermove',e=>{if(!drag)return;drag.moved ||= Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>8;window.AlchemyScene2D.moveHerbs(e);});
  panel.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(moved)window.AlchemyScene2D.dropHerbs(e);render();});
  panel.addEventListener('pointercancel',()=>{drag=null;window.AlchemyScene2D.cancel();render();});
  panel.addEventListener('keydown',e=>{if(!['Enter',' '].includes(e.key))return;const el=e.target.closest('[data-slot]');if(!el)return;e.preventDefault();const r=el.getBoundingClientRect();take(Number(el.dataset.slot),{clientX:r.x+r.width/2,clientY:r.y+r.height/2});});
  window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:order',render);render();
})();
