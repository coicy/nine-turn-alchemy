(() => {
  'use strict';
  const saves=window.AlchemySaves, api=window.AlchemyGame;
  const dialog=document.createElement('dialog');dialog.className='save-picker';dialog.id='savePicker';
  dialog.setAttribute('aria-labelledby','savePickerTitle');
  dialog.innerHTML='<header><h2 id="savePickerTitle">选择存档</h2><button type="button" data-close>关闭</button></header><p>进度自动保存。选择空存档，可从完整开场重新体验。</p><div class="save-slot-list"></div><p id="savePickerNotice" role="status"></p><small>存档保存在当前浏览器中。</small>';
  document.body.append(dialog);
  const notice=document.createElement('p');notice.className='save-notice';notice.setAttribute('role','status');notice.hidden=true;document.body.append(notice);
  const buttons=[];let confirmId=null;
  const busy=()=>api.snapshot().busy||window.AlchemyInteractionBusy||window.AlchemyScene2D?.busy;
  function open(){if(busy())return;confirmId=null;render();dialog.showModal();}
  for(const host of [document.querySelector('.opening-launch'),document.querySelector('.engine-nav')]){
    const b=document.createElement('button');b.type='button';b.className='save-open';b.setAttribute('aria-controls','savePicker');b.onclick=open;host.append(b);buttons.push(b);
  }
  function render(){
    const locked=!!busy();
    buttons.forEach(b=>{b.textContent='存档 '+saves.active+' · 选择存档';b.disabled=locked;});
    notice.hidden=!saves.error;notice.textContent=saves.error;
    const list=dialog.querySelector('.save-slot-list');list.replaceChildren();
    for(let id=1;id<=3;id++){
      const entry=saves.slot(id),data=entry.data,card=document.createElement('article');card.className='save-slot';
      const title=document.createElement('h3');title.textContent='存档 '+id+(id===saves.active?' · 当前':'');
      const description=document.createElement('p');description.textContent=entry.corrupt?'存档无法读取，原始数据已保留。':data?`第 ${data.campaign.day} 天 · ${data.campaign.economy?.coins||0} 铜钱 · ${data.campaign.phase==='finished'?'经营已结束':data.state.pillEnded?'空炉':'炉中有丹'}`:'空存档 · 全新开局';
      const date=document.createElement('small');date.textContent=data?(entry.updatedAt?'最近保存：'+new Date(entry.updatedAt).toLocaleString('zh-CN'):'由原有进度迁入'):'';
      const use=document.createElement('button');use.type='button';use.dataset.slot=String(id);use.textContent=data?'继续此存档':'从头开始';use.disabled=locked||!!entry.corrupt;
      card.append(title,description,date,use);
      if(data||entry.corrupt){const reset=document.createElement('button');reset.type='button';reset.className='save-reset';reset.dataset.reset=String(id);reset.textContent=confirmId===id?`确认清空存档 ${id}，重新开局`:'重新开局';reset.disabled=locked;card.append(reset);}
      list.append(card);
    }
    dialog.querySelector('#savePickerNotice').textContent=confirmId?`只会清空存档 ${confirmId}，其他存档保持不变。`:saves.error;
  }
  dialog.addEventListener('click',e=>{
    if(e.target.closest('[data-close]')){dialog.close();return;}
    const use=e.target.closest('[data-slot]'),reset=e.target.closest('[data-reset]');
    if(!use&&!reset||busy())return;
    const id=Number((use||reset).dataset[use?'slot':'reset']);
    if(reset&&confirmId!==id){confirmId=id;render();dialog.querySelector(`[data-reset="${id}"]`).focus();return;}
    if(reset&&!saves.reset(id)){render();return;}
    if(saves.select(id))location.reload();else render();
  });
  window.addEventListener('alchemy:render',render);window.addEventListener('alchemy:interaction',render);
  window.addEventListener('alchemy:fanning',()=>{queueMicrotask(render);setTimeout(render,1000);});
  render();
})();
