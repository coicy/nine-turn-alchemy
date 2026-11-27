/* Ordinary success preview before commission settlement. */
(() => {
  'use strict';
  const host=document.querySelector('.furnace-judgment');if(!host)return;
  const line=document.createElement('div');line.className='success-value-preview';line.hidden=true;
  line.innerHTML='<div class="success-value-main"></div><div class="success-value-sale"></div>';
  host.querySelector('.furnace-facts').after(line);
  const goal=document.createElement('div');goal.className='furnace-goal-strip';goal.hidden=true;
  line.after(goal);
  const format=n=>Math.round(n).toLocaleString('zh-CN');
  const delta=n=>(n>=0?'+':'−')+format(Math.abs(n));
  function update(){
    const v=window.AlchemyViewState.snapshot(),s=window.AlchemyGame.snapshot(),p=window.AlchemyGame.successValuePreview();
    if(s.busy&&!s.pillEnded&&!s.roundEnded&&v.current==='work'&&v.workMode==='furnace'){line.setAttribute('aria-busy','true');return;}
    line.removeAttribute('aria-busy');
    line.hidden=!p||v.current!=='work'||v.workMode!=='furnace';goal.hidden=line.hidden;if(line.hidden)return;
    const desktopWarm=innerWidth>650&&document.body.classList.contains('warm-cinnabar-experiment');
    const unit=s.craftKind?'估值':'药力';
    const nextLabel='下次成功 '+p.turn+'转 · '+unit+' '+format(p.value)+'（'+delta(p.increase)+'）';
    const mainEl=line.querySelector('.success-value-main'),saleEl=line.querySelector('.success-value-sale');
    if(desktopWarm){
      mainEl.innerHTML='<span class="success-value-kicker">下次成功</span><strong class="success-value-delta">'+delta(p.increase)+' → '+format(p.value)+'</strong>';
      saleEl.textContent='';
      line.setAttribute('aria-label',nextLabel+'；'+(s.craftKind?'自购器料成本 '+s.craftCost+' 文。':'药力每点售1铜钱，委托超额每点补1铜钱。'));
      if(s.order&&!s.craftKind&&s.target>0){
        const delivered=Math.round(s.delivered||0),livePotency=Math.round((s.value||0)+(s.yuanBonus||0)),total=delivered+livePotency;
        const rem=Math.max(0,Math.ceil(s.target-total)),pct=Math.min(100,Math.max(0,(total/s.target)*100));
        const lbl=delivered>0?'含已交':'委托目标';
        goal.dataset.mode='order';goal.dataset.met=rem===0?'true':'false';
        goal.innerHTML='<div class="furnace-goal-top"><span>'+lbl+' <b>'+format(total)+'</b> / '+format(s.target)+'</span><span class="furnace-goal-rem">'+(rem===0?'已达标':'还差 '+format(rem))+'</span></div><div class="furnace-goal-track" aria-hidden="true"><i style="width:'+pct.toFixed(1)+'%"></i></div>';
      }else{
        goal.dataset.mode='sale';goal.dataset.met='false';
        goal.innerHTML='<div class="furnace-goal-sale"><span>当前可售 <b>'+format(p.currentSale)+'</b> 钱</span><small>'+(s.craftKind?'自购器料成色':'随时收丹入匣')+'</small></div>';
      }
      goal.hidden=false;
    }else{
      goal.hidden=true;
      mainEl.textContent=nextLabel;
      saleEl.textContent=(p.currentSale>0||s.craftKind)?('当前可售 '+format(p.currentSale)+' 钱'):'';
      line.setAttribute('aria-label',line.textContent+'；药力每点售1铜钱，委托超额每点补1铜钱。');
      if(innerWidth<=650){mainEl.textContent='下次成功 '+p.turn+'转 · '+unit+' '+delta(p.increase);saleEl.textContent=(p.currentSale>0||s.craftKind)?('可售 '+format(p.currentSale)+'钱'):'';}
      if(s.craftKind){saleEl.textContent='可售 '+format(p.currentSale)+'钱';line.setAttribute('aria-label',line.textContent+'；自购器料成本 '+s.craftCost+' 文。');}
    }
    line.title=s.craftKind?'按普通成功计算的造物估值，不保证盈利。':'按普通成功计算；药力每点售1铜钱，委托超额每点补1铜钱。';
  }
  for(const e of ['alchemy:render','alchemy:view-ready','alchemy:interaction','alchemy:order','resize'])window.addEventListener(e,update);
  update();
})();
