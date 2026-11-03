(() => {
'use strict';
const api=window.AlchemyGame,E=window.AlchemyEconomy,panel=document.createElement('aside');panel.id='equipmentDrawer';panel.className='equipment-drawer';panel.hidden=true;panel.setAttribute('aria-label','炉旁法器说明');document.querySelector('.game-layout').append(panel);
let selected=null,changing=false,notice='';
function render(){const c=api.campaign();if(!c)return;const e=E.ensure(c),s=api.snapshot(),ids=E.equippedIds(e.equipped),locked=!s.pillEnded||s.busy||!!window.AlchemyInteractionBusy||!!window.AlchemyScene2D?.busy;
 if(selected===null&&ids.length===E.EQUIP_SLOTS)selected=ids[0];
 if(selected!==null&&!ids.includes(selected))selected=ids[0]||null;
 const tool=E.TOOL_DEFS.find(t=>t.id===selected),uses=s.toolProgress.uses[selected]||0;
 panel.innerHTML='<header class="equipment-heading"><h2>'+(tool?.name||'布置法器')+'</h2><button data-close-equipment>合上 ×</button></header><p role="status">'+notice+'</p>'+(tool?'<div class="world-tool-portrait" data-tool-art="'+tool.id+'"></div><p>'+tool.description+'</p><p>本炉已触发 '+uses+' 次 · '+(locked?'本炉已锁定，收丹后可调整':'空炉可调整')+'</p>':'<p>'+(locked?'炉内有丹，本炉不可布置，收丹后再调整。':'在案面承托处布置已购法器，炼化时自动生效。')+'</p>')+'<div class="equipment-actions">'+(!locked?'<button data-change-equipment>更换</button>'+(tool?'<button data-remove-equipment>撤下</button>':''):'')+'</div><div class="equipment-library" '+(changing||!tool?'':'hidden')+'><h3>选择已购法器</h3>'+E.TOOL_DEFS.filter(t=>e.tools.includes(t.id)).map(t=>'<button class="equipment-card" data-replace-equipment="'+t.id+'" '+(locked||ids.includes(t.id)?'disabled':'')+'><span data-tool-art="'+t.id+'"></span><strong>'+t.name+'</strong><small>'+t.description+'</small></button>').join('')+(!e.tools.length?'<p>还没有购入法器。</p>':'')+'<button data-equipment-market>前往坊市购置</button></div>';
 window.AlchemyWorldUI?.decorateTools(panel);
}
panel.addEventListener('click',e=>{if(e.target.closest('[data-close-equipment]'))window.dispatchEvent(new Event('alchemy:close-reading'));if(e.target.closest('[data-equipment-market]'))window.dispatchEvent(new Event('alchemy:market'));if(e.target.closest('[data-change-equipment]')){changing=true;render();}const remove=e.target.closest('[data-remove-equipment]'),replace=e.target.closest('[data-replace-equipment]');if(remove||replace){const next=remove?null:replace.dataset.replaceEquipment,old=selected;if(api.replaceEquipment(old,next)){selected=next;changing=false;notice=next?'法器已原位更换':'已撤下法器';}else notice='未更换：请检查是否空炉、是否已装备或与定向法器冲突';render();}});
window.AlchemyEquipmentView={inspect(id){selected=id;changing=false;notice='';render();window.dispatchEvent(new Event('alchemy:equipment'));}};
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
