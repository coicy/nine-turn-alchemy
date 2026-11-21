/* Merchandise sits on the player's reception counter, above the same painted desk as commissions. */
(() => {
  'use strict';
  const api=window.AlchemyGame, trade=window.AlchemyCounterTrade, E=window.AlchemyEconomy, UX=window.AlchemyUX;
  const board=document.querySelector('.counter-board');
  const sale=document.createElement('section');
  sale.id='counterSale'; sale.hidden=true; sale.setAttribute('aria-label','柜台选货');
  sale.innerHTML='<div class="sale-stage"><img class="sale-person" alt=""><div class="sale-desk"></div><header><strong></strong><button type="button" data-sale-leave>下次再看</button></header><div class="sale-wares" role="group" aria-label="柜上的货物"></div></div><div class="sale-slip"><div class="sale-description" id="counterSaleDetail"><button class="sale-use" data-sale-use hidden></button><div class="sale-facts" aria-live="polite" aria-atomic="true"></div></div><footer><div class="sale-account"><span class="sale-wallet"></span><span class="sale-status" role="status"></span></div><button type="button" data-sale-hold>留到收市</button><button type="button" data-sale-buy></button></footer></div>';
  board.append(sale);
  const stage=sale.querySelector('.sale-stage'), person=sale.querySelector('img'), wares=sale.querySelector('.sale-wares');
  const hold=sale.querySelector('[data-sale-hold]'),buy=sale.querySelector('[data-sale-buy]'),leave=sale.querySelector('[data-sale-leave]');
  const parcel='<img class="sale-parcel" src="assets/runtime-v10/herb-parcel-v1.webp" alt="">';
  const detail=sale.querySelector('.sale-description');
  const facts=detail.querySelector('.sale-facts'), useButton=detail.querySelector('[data-sale-use]');
  const framed=g=>g.kind==='tool'||g.kind==='furnace';
  function wareButton(g,d,i,selected) {
    const name=UX.esc(d.name);
    const tag=framed(g)?'':'<span class="sale-tag"><b>'+name+'</b><small>'+(d.disabled?d.status:d.price+' 文')+'</small></span>';
    const label=framed(g)?' aria-label="'+name+'"':'';
    return '<button type="button" data-sale-item="'+i+'" data-focus-key="sale-'+i+'" data-object="'+UX.esc(g.id)+'" data-type="'+UX.esc(g.kind)+'"'+label+' aria-controls="counterSaleDetail" aria-pressed="'+(i===selected)+'"><span class="sale-object">'+d.art+'</span>'+tag+'</button>';
  }
  function describe(c,g) {
    const e=c.economy;
    if (g.kind==='tool') {
      const d=E.TOOL_DEFS.find(t=>t.id===g.id),owned=e.tools.includes(g.id);
      return {name:d.name,price:d.price,description:d.description,status:owned?'已持有':'',disabled:owned,art:'<i class="tool-art" data-tool-art="'+d.id+'"></i>'};
    }
    if (g.kind==='craftMaterial') {
      const d=window.AlchemyCrafts.get(g.id);
      return {name:d.material,price:d.price,status:'库存 '+e.craftStock[g.id]+' 份',disabled:e.craftStock[g.id]>=999,description:'一份炼一件'+d.name+'，炸炉损失器料。',art:UX.art({craftKind:g.id,turn:1})+parcel};
    }
    if (g.kind==='furnace') {
      return {name:'改炉图样',price:E.UPGRADES[e.furnace+1],status:['原炉胆','护胆已改','改良完成'][e.furnace],disabled:e.furnace>=2,description:['改良炉胆，每炉首次受损时，药力损失减半。','改良凝丹部件，受损时保住当前转数，药力损失减半。','两道改炉工序都已完成。'][e.furnace],art:'<i class="sale-plan"><span class="world-stove-diagram"></span></i>'};
    }
    const fine=g.id===1;
    return {name:fine?'精选药包':'普通药包',price:trade.price(c,g.kind,g.id,E.PRICES[g.id]),status:'库存 '+e.stock[g.id]+' 包',description:fine?'起炉至少良品。这趟随身带的货，便宜六文。':'一包可自炼一炉。',art:parcel+'<i class="sale-seal">'+(fine?'精':'普')+'</i>'};
  }
  function fit() {
    const w=stage.clientWidth,h=stage.clientHeight;
    if (!w||!h) return;
    const scale=Math.max(w/1672,h/941), edge=(h-941*scale)/2+523*scale;
    const count=wares.children.length, depth=h-edge;
    const twoRows=count>=4 && w<=650 && (w<count*84+24 || depth>=170);
    const rowPadding=wares.classList.contains('sale-objects-only')?14:42;
    const size=twoRows?Math.min(94,w/(count===4?2:3)*.76,(depth-18)/2-rowPadding):Math.min(104,w/(count+1)*.77,h*.22);
    wares.dataset.count=String(count);
    wares.classList.toggle('sale-two-rows',twoRows);
    stage.style.setProperty('--desk-edge',edge+'px');
    stage.style.setProperty('--size',Math.max(28,Math.round(size))+'px');
  }
  new ResizeObserver(fit).observe(stage);
  function render() {
    const c=api.campaign(),a=c?.sellers?.active;
    const visible=a && ['goods','bought'].includes(a.phase);
    sale.hidden=!visible; board.classList.toggle('selling-goods',!!visible);
    if (!visible) sale.querySelector('.sale-status').textContent='';
    if (!visible) return;
    const seller=trade.merchants[a.seller], goods=a.goods.map(g=>describe(c,g)),g=a.goods[a.selected],d=goods[a.selected];
    person.src=seller.portrait;
    stage.querySelector('header strong').textContent=seller.name+(a.source==='held'?' · 今日留货':a.source==='delivery'?' · 送药':'');
    wares.classList.toggle('sale-objects-only',a.goods.every(framed));
    UX.html(wares,goods.map((d,i)=>wareButton(a.goods[i],d,i,a.selected)).join(''));
    window.AlchemyWorldUI?.decorateTools(wares);
    const use=g.kind==='tool' && c.economy.tools.includes(g.id) ? '回炉布置' : g.kind==='craftMaterial' && c.economy.craftStock[g.id] ? '回丹房取料' : '';
    const displayPrice=framed(g) && Number.isFinite(d.price);
    const price=displayPrice?'<strong class="sale-price">'+d.price+' 文</strong>':'';
    detail.classList.toggle('sale-framed-detail',framed(g));
    useButton.hidden=!use; useButton.textContent=use;
    const info='<header><h3>'+d.name+'</h3>'+price+(d.status?'<span>'+d.status+'</span>':'')+'</header><p>'+d.description+'</p>';
    if (facts.innerHTML!==info) facts.innerHTML=info;
    sale.querySelector('.sale-wallet').textContent='现有 '+c.economy.coins+' 文';
    hold.hidden=a.source!=='first'||g.kind!=='tool'||d.disabled;
    const short=Math.max(0,(d.price||0)-c.economy.coins);
    buy.disabled=!!(d.disabled||short);
    const purchase=g.kind==='furnace'?'改炉':'买下';
    buy.textContent=d.disabled?d.status:short?'还差 '+short+' 文':displayPrice?purchase:purchase+' · '+d.price+' 文';
    leave.textContent=a.source==='delivery'?'收起药单':a.source==='held'?'稍后再取':'送客';
    fit();
  }
  sale.addEventListener('click',event=>{
    const b=event.target.closest('button');if(!b||b.disabled)return;
    const msg=sale.querySelector('.sale-status');msg.textContent='';
    if (b.hasAttribute('data-sale-item')) api.merchantAction('select',Number(b.dataset.saleItem));
    if (b.hasAttribute('data-sale-use')) {
      const a=api.campaign().sellers.active;
      if (api.merchantAction('leave')) {
        window.dispatchEvent(new Event('alchemy:merchant-return-work'));
        window.AlchemyViewState.navigate('work',{workMode:'room'});
        if (a.goods[a.selected].kind==='tool') window.AlchemyEquipmentView.inspect(null);
      }
      return;
    }
    if (b===hold||b===leave) {
      if (api.merchantAction(b===hold?'hold':'leave')) {
        window.dispatchEvent(new Event('alchemy:interaction'));
        if(b===hold) window.AlchemyUX.tell('货已留在柜上，今日收市前可回来取。');
      }
    } else if (b===buy) {
      const c=api.campaign(),a=c.sellers.active,g=a.goods[a.selected];
      if (api.economyAction(g.kind,g.id)) msg.textContent=g.kind==='furnace'?'炉具已改良':g.kind==='tool'?'法器已购入':'已收入备药匣';
    }
  });
  for (const e of ['alchemy:render','alchemy:interaction','alchemy:view-ready']) window.addEventListener(e,render);
  window.AlchemyCounterDisplay={render,focus(){const b=wares.querySelector('[aria-pressed=true]');b?.focus({preventScroll:true});}};
})();
