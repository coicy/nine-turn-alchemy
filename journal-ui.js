(() => {
 'use strict';
 const api=window.AlchemyGame, E=window.AlchemyEconomy;
 const record=document.querySelector('.order-panel'),manual=document.querySelector('.side-panel');
 function book(panel,title,labels){
  panel.classList.add('journal-book');
  const original=Array.from(panel.children).filter(n=>n.tagName!=='SUMMARY');
  const header=document.createElement('header');header.className='journal-heading';
  const h=document.createElement('h2');h.textContent=title;header.append(h);
  const tabs=document.createElement('nav');tabs.className='journal-tabs';tabs.setAttribute('aria-label',title+'书页');
  const pages=labels.map((label,i)=>{
   const page=document.createElement('section');page.className='journal-page';page.id=title==='经营簿'?'ledger-page-'+i:'manual-page-'+i;page.hidden=i!==0;
   const b=document.createElement('button');b.type='button';b.textContent=label;b.setAttribute('aria-controls',page.id);b.setAttribute('aria-pressed',String(i===0));
   b.onclick=()=>{pages.forEach((p,j)=>p.hidden=j!==i);Array.from(tabs.children).forEach((t,j)=>t.setAttribute('aria-pressed',String(j===i)));};
   tabs.append(b);return page;
  });
  header.append(tabs);panel.append(header,...pages);return {original,pages};
 }
 const ledger=book(record,'经营簿',['本单记录','经营收支']);ledger.pages[0].append(...ledger.original);
 ledger.pages[0].querySelector('.deferred-note')?.remove();
 const totals=document.createElement('div');totals.className='ledger-totals';ledger.pages[1].append(totals);
 const handbook=book(manual,'丹纹炉谱',['丹纹图录','最近炉讯','试玩记录']);let chapter=0;
 for(const n of handbook.original){if(n.classList.contains('divider')){n.remove();continue;}if(n.textContent==='最近炉讯')chapter=1;if(n.textContent==='试玩记录')chapter=2;handbook.pages[chapter].append(n);}
 const entries=handbook.pages[0].querySelectorAll('.fusion-entry');
 Object.entries(api.RUNE_DEFS).forEach(([name,effect],i)=>{if(entries[i]){entries[i].firstElementChild.textContent=name;entries[i].lastElementChild.textContent=effect;}});
 const rack=document.createElement('button');rack.type='button';rack.className='scene-loadout';rack.setAttribute('aria-label','打开炉边法器匣');
 rack.onclick=()=>window.dispatchEvent(new Event('alchemy:equipment'));document.getElementById('pillStage').append(rack);
 const ids=E.TOOL_DEFS.map(t=>t.id); // Atlas follows the shared catalogue order.
 let lastRack='';
 function render(){const c=api.campaign();if(!c)return;const e=E.ensure(c);
  totals.replaceChildren();const title=document.createElement('h3');title.textContent='第 '+c.day+' 天 · 经营收支';totals.append(title);
  const dl=document.createElement('dl');for(const [label,value] of [['现有铜钱',e.coins],['累计收入',e.earned],['累计支出',e.spent]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value+' 铜钱';dl.append(dt,dd);}totals.append(dl);
  const note=document.createElement('p');note.textContent='收入包含委托工钱、加赏与自炼售丹；支出包含购药、法器与炉具升级。';totals.append(note);
  const h=document.createElement('h3');h.textContent='每日委托结算';totals.append(h);
  if(!c.history.length){const p=document.createElement('p');p.textContent='尚未日结。返回柜台处理委托后，可在此查阅每日结果。';totals.append(p);}
  for(const day of c.history.slice().reverse()){const p=document.createElement('p');p.className='ledger-day';p.textContent=`第 ${day.day} 天　完成 ${day.completed} 单 · 失败 ${day.failed} 单 · 交付丹值 ${day.delivered}`;totals.append(p);}
  const equipped=E.equippedIds(e.equipped),locked=!api.snapshot().pillEnded;const key=equipped.join('|')+locked;
  if(key===lastRack)return;lastRack=key;rack.replaceChildren();const label=document.createElement('span');label.textContent='炉边法器匣 · '+(locked?'本炉已锁定':'点击配装');rack.append(label);
  const row=document.createElement('div');row.className='scene-loadout-slots';rack.append(row);
  for(let n=0;n<3;n++){const id=equipped[n],tool=E.TOOL_DEFS.find(t=>t.id===id),slot=document.createElement('span');slot.className='scene-loadout-slot';
   if(tool){const i=ids.indexOf(id),art=document.createElement('i');art.className='tool-art';art.style.backgroundPosition=`${(i%6)*20}% ${Math.floor(i/6)*50}%`;art.setAttribute('aria-hidden','true');slot.append(art);}
   const name=document.createElement('small');name.textContent=tool?.name||'空位';slot.append(name);row.append(slot);
  }
 }
 window.addEventListener('alchemy:render',render);render();
})();
