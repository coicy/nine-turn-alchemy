(() => {
 'use strict';
 const game=window.AlchemyGame,route=window.AlchemyViewState,UX=window.AlchemyUX;
 const {TOOL_DEFS,EQUIP_SLOTS,equippedIds}=window.AlchemyEconomy;
 const stock=document.querySelector('.scene-stock'),nav=stock.querySelector('.scene-stock-nav');
 const title=document.createElement('div');
 title.className='warm-stock-title';
 title.innerHTML='<span>药匣</span>';
 title.append(nav.querySelector('.scene-balance'));
 nav.before(title);
 nav.innerHTML='<button type="button" data-stock-filter="materials">原料</button><button type="button" data-stock-filter="products">成品</button><button type="button" data-stock-filter="tools">法器</button>';
 nav.setAttribute('role','group');
 nav.setAttribute('aria-label','药匣筛选');
 const tools=document.createElement('section');
 tools.className='warm-stock-tools';
 tools.setAttribute('aria-label','已拥有的法器');
 stock.querySelector('.scene-pill-stock').after(tools);
 let toolsKey='',selectedTool=null;
 function renderTools(){
  const economy=game.campaign()?.economy;
  if(!economy||stock.dataset.filter!=='tools')return;
  const equipped=equippedIds(economy.equipped),state=game.snapshot();
  const owned=TOOL_DEFS.filter(tool=>economy.tools.includes(tool.id));
  if(!owned.some(tool=>tool.id===selectedTool))selectedTool=null;
  const key=JSON.stringify([owned.map(tool=>tool.id),equipped,state.toolProgress.uses,state.pillEnded,selectedTool]);
  if(toolsKey===key)return;
  toolsKey=key;
  UX.html(tools,owned.length?'<p class="warm-tool-count"><span>已布置 '+equipped.length+' / '+EQUIP_SLOTS+'</span><span>勾选即生效</span></p><ul>'+owned.map(tool=>{
   const id=UX.esc(tool.id),name=UX.esc(tool.name);
   const placed=equipped.includes(tool.id);
   const expanded=selectedTool===tool.id;
   const spent=placed&&!state.pillEnded&&['seal','phoenix'].includes(tool.id)&&state.toolProgress.uses[tool.id];
   return '<li><button type="button" class="warm-tool-pick" data-stock-tool="'+id+'" data-focus-key="tool-detail-'+id+'" aria-expanded="'+expanded+'" aria-controls="warm-tool-'+id+'"><span data-tool-art="'+id+'"></span><span>'+name+'</span></button>'
    +'<label class="warm-tool-check"><input type="checkbox" data-equip-tool="'+id+'" data-focus-key="tool-equip-'+id+'" aria-label="布置'+name+'"'+(placed?' checked':'')+'></label>'
    +'<div class="warm-tool-detail" id="warm-tool-'+id+'"'+(expanded?'':' hidden')+'><p>'+UX.esc(tool.description)+'</p>'+(spent?'<p>本炉已用尽</p>':'')+'</div>'
    +'<div class="warm-tool-notice" role="alert" hidden></div></li>';
  }).join('')+'</ul>':'<p class="warm-stock-empty">暂无法器</p>');
  window.AlchemyWorldUI.decorateTools(tools);
 }
 function select(filter){
  stock.dataset.filter=filter;
  nav.querySelectorAll('[data-stock-filter]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.stockFilter===filter)));
  renderTools();
  window.AlchemyWorldLayout.fit();
 }
 nav.addEventListener('click',event=>{
  const button=event.target.closest('[data-stock-filter]');
  if(button)select(button.dataset.stockFilter);
 });
 tools.addEventListener('click',event=>{
  const button=event.target.closest('[data-stock-tool]');
  if(!button)return;
  const id=button.dataset.stockTool;
  selectedTool=selectedTool===id?null:id;
  renderTools();
  window.AlchemyWorldLayout.fit();
  if(selectedTool)document.getElementById('warm-tool-'+id).scrollIntoView({block:'nearest'});
 });
 tools.addEventListener('change',event=>{
  const checkbox=event.target.closest('[data-equip-tool]');
  if(!checkbox)return;
  const id=checkbox.dataset.equipTool;
  const checked=checkbox.checked;
  const oldId=checked?null:id,newId=checked?id:null;
  const result=game.canReplaceEquipment(oldId,newId);
  let reason=result.reason;
  if(result.ok){
   if(route.snapshot().workMode!=='room')reason='请返回工坊后调整法器。';
   else if(game.replaceEquipment(oldId,newId)){
    window.AlchemyGameFeel?.emit('equipment',{oldId,newId,tier:'medium'});
    return;
   }else reason='当前无法调整法器，请稍后再试。';
  }else if(checked&&reason.startsWith('三个位置已满'))reason='同时只能有三个法器生效。';
  checkbox.checked=equippedIds(game.campaign()?.economy?.equipped).includes(id);
  tools.querySelectorAll('.warm-tool-notice:not([hidden])').forEach(notice=>{notice.hidden=true;notice.textContent='';});
  const notice=checkbox.closest('li').querySelector('.warm-tool-notice');
  notice.hidden=false;
  notice.textContent=reason;
  window.AlchemyWorldLayout.fit();
  notice.scrollIntoView({block:'nearest'});
 });
 window.addEventListener('alchemy:pill-stored',()=>select('products'));
 window.addEventListener('alchemy:reserve-select',()=>select('materials'));
 window.addEventListener('alchemy:render',renderTools);
 window.addEventListener('alchemy:view-ready',renderTools);
 select('materials');

 const canvas=document.getElementById('alchemyScene'),viewport=document.querySelector('.engine-viewport');
 const marker=document.createElement('div');
 marker.className='warm-stock-drop';
 marker.setAttribute('aria-hidden','true');
 marker.hidden=true;
 document.body.append(marker);
 let drag=null,suppressClick=false;
 function mouthRect(){
  const box=canvas.getBoundingClientRect(),view=viewport.getBoundingClientRect();
  const mouth=window.AlchemyScene2D.mouth;
  const sx=box.width/canvas.width,sy=box.height/canvas.height;
  const left=Math.max(view.left,box.left+mouth.x*sx),top=Math.max(view.top,box.top+mouth.y*sy);
  const right=Math.min(view.right,box.left+(mouth.x+mouth.w)*sx),bottom=Math.min(view.bottom,box.top+(mouth.y+mouth.h)*sy);
  return {left,top,right,bottom};
 }
 function overMouth(event,box){
  const {clientX:x,clientY:y}=event;
  const hit=document.elementFromPoint(x,y);
  return x>=box.left&&x<=box.right&&y>=box.top&&y<=box.bottom
   &&viewport.contains(hit)&&!hit?.closest('.scene-stock,button:not(.furnace-resume):not(.workbench-hotspot)');
 }
 function cancelDrag(){
  if(!drag)return;
  const {card,pointer,ghost}=drag;
  drag=null;
  ghost?.remove();
  marker.hidden=true;
  if(card.hasPointerCapture(pointer))card.releasePointerCapture(pointer);
 }
 stock.addEventListener('dragstart',event=>{
  if(event.target.closest('[data-stock-pill]'))event.preventDefault();
 });
 stock.addEventListener('pointerdown',event=>{
  const card=event.target.closest('[data-stock-pill]');
  if(!card||event.button!==0||!event.isPrimary||drag)return;
  suppressClick=false;
  drag={card,id:card.dataset.stockPill,pointer:event.pointerId,x:event.clientX,y:event.clientY,ghost:null};
  card.setPointerCapture(event.pointerId);
 });
 stock.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  if(!drag.ghost){
   if(Math.hypot(event.clientX-drag.x,event.clientY-drag.y)<8)return;
   const ghost=document.createElement('div');
   ghost.className='warm-stock-ghost';
   ghost.setAttribute('aria-hidden','true');
   const art=drag.card.querySelector('img');
   if(art)ghost.append(art.cloneNode());
   document.body.append(ghost);
   drag.ghost=ghost;
  }
  drag.ghost.style.transform='translate('+event.clientX+'px,'+event.clientY+'px) translate(-50%,-50%)';
  const box=mouthRect();
  const eligible=game.canReturnPill(drag.id).ok;
  marker.hidden=!eligible;
  if(eligible){
   Object.assign(marker.style,{left:box.left+'px',top:box.top+'px',width:Math.max(0,box.right-box.left)+'px',height:Math.max(0,box.bottom-box.top)+'px'});
   marker.classList.toggle('is-targeted',overMouth(event,box));
  }
 });
 stock.addEventListener('pointerup',event=>{
  if(!drag||event.pointerId!==drag.pointer)return;
  const {id,ghost}=drag;
  const target=ghost&&route.snapshot().current==='work'&&overMouth(event,mouthRect());
  suppressClick=!!ghost;
  cancelDrag();
  if(!target)return;
  const result=game.canReturnPill(id);
  if(!result.ok){UX.tell(result.reason);return;}
  if(game.returnPill(id)&&route.snapshot().workMode==='room')route.navigate('work',{workMode:'furnace'});
 });
 stock.addEventListener('lostpointercapture',cancelDrag);
 stock.addEventListener('pointercancel',cancelDrag);
 document.addEventListener('click',event=>{
  if(!suppressClick||!event.detail)return;
  suppressClick=false;
  if(event.target.closest('[data-stock-pill]')){event.preventDefault();event.stopImmediatePropagation();}
 },true);
 window.addEventListener('blur',cancelDrag);
 window.addEventListener('alchemy:view-ready',cancelDrag);
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&drag){event.preventDefault();event.stopPropagation();cancelDrag();}
 },true);
})();
