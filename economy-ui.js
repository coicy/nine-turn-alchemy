(() => {
const api=window.AlchemyGame,E=window.AlchemyEconomy;
const toolBadge=document.createElement('button');toolBadge.type='button';toolBadge.className='equipped-tool-status';toolBadge.setAttribute('aria-controls','equipmentDrawer');toolBadge.setAttribute('aria-expanded','false');toolBadge.addEventListener('click',()=>window.dispatchEvent(new Event('alchemy:equipment')));document.querySelector('.forge-panel').prepend(toolBadge);
function render(){const c=api.campaign();if(!c)return;const e=E.ensure(c),s=api.snapshot();
const equipped=E.equippedIds(e.equipped),tp=s.toolProgress||{},counts=tp.uses||{};
const progress=id=>id==='repair'?`减险${(tp.scars||0)*15}%`:id==='chain'?`连成${tp.chain||0}次`:id==='fissure_cone'?`${tp.fissureTriggers||0}/3`:id==='hearth_pin'?`余${Math.max(0,3-(tp.refineCount||0))}次`:id==='guard_casket'?(tp.guardCasketUsed?'已用尽':'待触发'):id==='steady_talisman'?(tp.yuanFloorUsed?'已用尽':'待触发'):id==='risk_ruler'?(tp.riskRulerExpired?'已达上限':`转${Math.round((tp.riskRulerConverted||0)*100)}%`):['seal','phoenix'].includes(id)?(counts[id]?'已触发':'待触发'):'';
toolBadge.hidden=!e.tools.length;toolBadge.textContent=`法器 ${equipped.length}/${E.EQUIP_SLOTS} · `+(equipped.length?equipped.map(id=>E.TOOL_DEFS.find(t=>t.id===id).name+' '+progress(id)).join(' ｜ '):'未装备')+' · 配装 ›';
}
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
