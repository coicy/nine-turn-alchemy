(() => {
'use strict';
const api=window.AlchemyGame,E=window.AlchemyEconomy,layout=document.querySelector('.game-layout');
const drawer=document.createElement('aside');drawer.id='equipmentDrawer';drawer.className='equipment-drawer';drawer.hidden=true;drawer.setAttribute('aria-label','法器匣 · 炼丹配装');
layout.append(drawer);
const names=ids=>ids.map(id=>E.TOOL_DEFS.find(t=>t.id===id)?.name||id);
function render(){
 const c=api.campaign();if(!c)return;
 const e=E.ensure(c),s=api.snapshot(),equipped=E.equippedIds(e.equipped),locked=s.busy||!!window.AlchemyInteractionBusy||!s.pillEnded;
 const focused=document.activeElement?.dataset?.equipment;
 const owned=E.TOOL_DEFS.filter(t=>e.tools.includes(t.id));
 drawer.innerHTML=`<header class="equipment-heading"><div><span class="panel-kicker">炉边配装</span><h2>法器匣 <small>${equipped.length}/${E.EQUIP_SLOTS}</small></h2></div><button type="button" data-close-equipment aria-label="关闭法器匣">收起 ×</button></header>
 <p class="equipment-state" role="status">${locked?'炉火已起 · 本炉配装已锁定，收丹后可换装':'空炉可换装 · 装备效果在炼化时自动触发'}</p>
 <div class="equipment-slots" aria-label="当前三件法器">${Array.from({length:E.EQUIP_SLOTS},(_,i)=>{const id=equipped[i],tool=E.TOOL_DEFS.find(t=>t.id===id);return `<button type="button" class="equipment-slot ${id?'filled':''}" data-equipment="${id||'empty-'+i}" ${locked||!id?'disabled':''} title="${tool?.description||'从下方已购法器中装备'}"><small>槽位 ${i+1}</small><strong>${tool?.name||'空位'}</strong><span>${id?'点击卸下':'待装备'}</span></button>`;}).join('')}</div>
 <div class="equipment-library"><h3>已购法器 · ${owned.length} 件</h3><p class="equipment-help">同炉最多三件；定向法器限一件。换装不消耗法器。</p>
 ${owned.length?owned.map(t=>{const active=equipped.includes(t.id),conflict=!active&&t.runeTarget&&E.runeTarget(e.equipped),full=!active&&equipped.length>=E.EQUIP_SLOTS;return `<article class="equipment-card ${active?'is-equipped':''}"><div><h4>${t.name}</h4><span>${active?'已装备':t.runeTarget?'定向 · '+t.runeTarget:'未装备'}</span></div><p>${t.description}</p><button type="button" data-equipment="${t.id}" ${locked||conflict||full?'disabled':''}>${active?'卸下':conflict?'先卸下其他定向法器':full?'装备槽已满':'装备'}</button></article>`;}).join(''):'<div class="equipment-empty">法器匣还是空的。前往坊市购入法器后，即可在这里配装。</div>'}
 <button type="button" data-equipment-market>前往坊市购置 ›</button>
 <details class="equipment-combos"><summary>查看组合思路</summary><p>生纹针＋燃纹盏＋回纹环：生纹、护丹、补纹。</p><p>燃纹盏＋回纹环＋烬金印：消耗、回收、增值。</p><p>生纹针＋合璧镜＋六合盘：融合补纹、满纹减险。</p></details></div>`;
 drawer.dataset.loadout=names(equipped).join(' / ');
 if(focused&&!drawer.hidden)drawer.querySelector(`[data-equipment="${focused}"]`)?.focus({preventScroll:true});
}
drawer.addEventListener('click',event=>{
 if(event.target.closest('[data-close-equipment]')){window.dispatchEvent(new Event('alchemy:work'));return;}
 if(event.target.closest('[data-equipment-market]')){window.dispatchEvent(new Event('alchemy:market'));return;}
 const button=event.target.closest('[data-equipment]');if(button&&!button.disabled&&!button.dataset.equipment.startsWith('empty-'))api.economyAction('equip',button.dataset.equipment);
});
window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);render();
})();
