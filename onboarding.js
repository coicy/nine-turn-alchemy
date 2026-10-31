(() => {
  'use strict';
  const api=window.AlchemyGame, stage=document.getElementById('pillStage');
  const expand=document.createElement('button');
  expand.type='button';expand.className='onboarding-expand';expand.textContent='查看全部功能';
  expand.setAttribute('aria-label','显示全部经营功能，保留当前进度');
  document.querySelector('.engine-nav').append(expand);
  let expanded=false;
  try { expanded=window.AlchemySaves ? window.AlchemySaves.preference('expanded')===true : localStorage.getItem('alchemy-onboarding-expanded-v53')==='true'; } catch {}
  expand.onclick=()=>{expanded=true;try {if(window.AlchemySaves)window.AlchemySaves.setPreference('expanded',true);else localStorage.setItem('alchemy-onboarding-expanded-v53','true');} catch {} update();};
  const runes=document.getElementById('roomRunes'),details=document.createElement('details');
  details.className='observation-details';
  const summary=document.createElement('summary');summary.textContent='品质与丹纹详情';
  const quality=document.createElement('p'),effects=document.createElement('p');
  runes.before(details);details.append(summary,quality,runes,effects);
  function update(){
    const s=api.snapshot(),c=api.campaign(),e=c?.economy;
    const journey=!!(s.started&&c&&c.day===1&&!c.history.length&&!expanded);
    const resolved=c?.orders.some(o=>['completed','failed','skipped'].includes(o.status));
    const guided=journey&&!resolved&&!s.order?.self&&!e?.selfCount&&!s.roundEnded;
    document.body.classList.toggle('guided-journey',journey);
    document.body.classList.toggle('guided-opening',guided);
    document.body.classList.toggle('journey-orders',!!resolved);
    document.body.classList.toggle('journey-shop',!!(e?.earned||e?.selfCount||Object.values(e?.herbs||{}).some(n=>n>0)));
    document.body.classList.toggle('journey-tools',!!e?.tools?.length);
    expand.hidden=!journey;
    quality.textContent='品质：'+document.getElementById('qualityValue').textContent+' · 药性：'+document.getElementById('natureValue').textContent;
    effects.textContent=(s.runes||[]).map(name=>`${name}：${api.RUNE_DEFS[name]||''}`).join('；');
    const secondary=document.querySelector('#roomSettlement [data-destination="shop"]');
    secondary.hidden=journey&&!Object.values(e?.herbs||{}).some(n=>n>0);
    if(s.roundEnded&&s.order&&!s.order.self){
      document.querySelector('#roomSettlement [data-destination="orders"]').textContent=c?.phase==='open'&&c.orders.some(o=>o.status==='pending')?'接待下一位客人':'回柜台收工';
      if(s.order.gifted)secondary.textContent='赠留余药可自炼 · 去看看';
    }
    const text=instruction(s);if(text)document.getElementById('workInstruction').textContent=text;
  }
  function instruction(s){
    if(!document.body.classList.contains('guided-journey')||window.AlchemyInteractionBusy||s.busy||stage.dataset.held||window.AlchemyScene2D?.held||s.runeChoices?.length)return '';
    if(s.roundEnded)return '本单已结清。接待下一位客人，继续经营丹坊。';
    if(!s.order)return '到接待柜台，选一份委托。';
    if(s.pillEnded)return s.endReason==='explode'?`这一包药没了，客人不要求赔偿。还剩 ${s.remaining} 包，可以再试。`:s.attempt>0?'这颗丹已交付。取下一包药，继续完成本单。':'先点药包，再点炉口，投入一包药材。';
    if(s.turn>=100)return '百转已成。点丹药拿起，再点收丹盘交付。';
    if(s.turn===1)return '点击火门，炼化一次。';
    return s.delivered+s.value>=s.target?'现在收丹即可完成本单。点丹药拿起，再点收丹盘交付；也可继续冒险。':'看看丹值与炸丹概率：继续炼化，或取丹放入收丹盘。';
  }
  window.AlchemyOnboarding={instruction};
  window.addEventListener('alchemy:render',update);window.addEventListener('alchemy:interaction',update);
  new MutationObserver(update).observe(stage,{attributes:true,attributeFilter:['data-held']});
  update();
})();
