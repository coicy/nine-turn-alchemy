(() => {
const api=window.AlchemyGame,E=window.AlchemyEconomy;
const toolBadge=document.createElement('button');toolBadge.type='button';toolBadge.className='equipped-tool-status';toolBadge.setAttribute('aria-controls','equipmentDrawer');toolBadge.setAttribute('aria-expanded','false');toolBadge.addEventListener('click',()=>window.dispatchEvent(new Event('alchemy:equipment')));document.querySelector('.forge-panel').prepend(toolBadge);
function render(){const c=api.campaign();if(!c)return;const e=E.ensure(c),s=api.snapshot();
const equipped=E.equippedIds(e.equipped),counts=s.toolProgress?.uses||{};
const progress=id=>id==='repair'?`减险${(s.toolProgress?.scars||0)*15}%`:id==='chain'?`连成${s.toolProgress?.chain||0}次`:['seal','phoenix'].includes(id)?(counts[id]?'已触发':'待触发'):'';
toolBadge.hidden=!e.tools.length;toolBadge.textContent=`法器 ${equipped.length}/${E.EQUIP_SLOTS} · `+(equipped.length?equipped.map(id=>E.TOOL_DEFS.find(t=>t.id===id).name+' '+progress(id)).join(' ｜ '):'未装备')+' · 配装 ›';
}
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
