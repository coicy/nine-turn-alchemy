/* Ordinary success only: no random rune income or commission income promised. */
(() => {
  'use strict';
  const host=document.querySelector('.furnace-judgment');if(!host)return;
  const line=document.createElement('div');line.className='success-value-preview';line.hidden=true;
  line.innerHTML='<div class="success-value-main"></div><div class="success-value-sale"></div>';
  host.querySelector('.furnace-facts').after(line);
  const format=n=>Math.round(n).toLocaleString('zh-CN');
  const delta=n=>(n>=0?'+':'−')+format(Math.abs(n));
  function update(){
    const v=window.AlchemyViewState.snapshot(),s=window.AlchemyGame.snapshot(),p=window.AlchemyGame.successValuePreview();
    if(s.busy&&!s.pillEnded&&!s.roundEnded&&v.current==='work'&&v.workMode==='furnace'){line.setAttribute('aria-busy','true');return;}
    line.removeAttribute('aria-busy');
    line.hidden=!p||v.current!=='work'||v.workMode!=='furnace';if(line.hidden)return;
    line.querySelector('.success-value-main').textContent='下次成功 '+p.turn+'转 · 药力 '+format(p.value)+'（'+delta(p.increase)+'）';
    line.querySelector('.success-value-sale').textContent='1点药力＝1铜钱';
    line.setAttribute('aria-label',line.textContent+'；随机生纹另计；药力每点售1铜钱，委托超额每点补1铜钱。');
    if(innerWidth<=650){line.querySelector('.success-value-main').textContent='下次成功\n药力 '+delta(p.increase);line.querySelector('.success-value-sale').textContent='可售 '+format(p.currentSale)+'钱';}
    line.title='按普通成功及当前丹纹计算，随机生纹另计；药力每点售1铜钱，委托超额每点补1铜钱。';
  }
  for(const e of ['alchemy:render','alchemy:view-ready','alchemy:interaction','resize'])window.addEventListener(e,update);
  update();
})();
