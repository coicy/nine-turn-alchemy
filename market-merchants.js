/* Stock and appointments live in the campaign so a resumed day keeps its visitors and prices. */
(() => {
  'use strict';
  const merchants = {
    artificer: {name:'法器商', portrait:'assets/scene-props/merchant.webp'},
    trader: {name:'周掌柜', portrait:'assets/customers-market/merchant.webp',fromDay:2,
      pack:()=>sample(window.AlchemyCrafts.defs.map(d=>d.id),2).map(id=>item('craftMaterial',id))},
    herbalist: {name:'何采药', portrait:'assets/customers-market/herbalist.webp',fromDay:2,
      pack:()=>[item('material',1),item('material',0)]}
  };
  const closed = c => c.orders.filter(o => ['completed','failed'].includes(o.status)).length;
  const item = (kind,id) => ({kind,id});
  const tools = ids => ids.map(id => item('tool',id));
  const firstTools = ['ward','seal','stone','lucky'];
  const maxVisitingTools = 5;
  function firstVisit(phase) {
    return {seller:'artificer',source:'first',phase,goods:tools(firstTools),selected:0};
  }
  function sample(ids,limit) {
    const pool = [...ids], result = [];
    while (pool.length && result.length < limit) result.push(pool.splice(Math.floor(Math.random()*pool.length),1)[0]);
    return result;
  }
  function extraTools(c,existing) {
    const eligible=window.AlchemyEconomy.TOOL_DEFS.filter(t=>t.day<=c.day && !c.economy.tools.includes(t.id) && !existing.includes(t.id));
    const extra=window.AlchemyEconomy.hasTool(c.economy.equipped,'stock_talisman')?1:0;
    return sample(eligible.map(t=>t.id),maxVisitingTools+extra-existing.length);
  }
  // Top up an older, already rolled visit once. Keep the selected object, including a furnace plan.
  function expandSavedVisit(c,offer) {
    if (offer?.seller!=='artificer' || offer.source==='held' || ['bought','equip'].includes(offer.phase)) return;
    const goods=offer.goods, existing=goods.filter(g=>g.kind==='tool').map(g=>g.id);
    const selected=goods[offer.selected], upgrade=goods.findIndex(g=>g.kind==='furnace');
    const added=offer.source==='first'?firstTools.filter(id=>!existing.includes(id)):extraTools(c,existing);
    goods.splice(upgrade<0?goods.length:upgrade,0,...tools(added));
    if (selected) offer.selected=goods.indexOf(selected);
  }
  function ensure(c,legacy) {
    if (!c.sellers) {
      const phase = legacy?.phase;
      c.sellers = {day:0, stockVersion:2, introduced:['market','equip','done'].includes(phase), nextTools:0};
      if (['counter','market','equip'].includes(phase)) {
        c.sellers.day = c.day;
        const received=phase==='market' && c.economy.tools.includes('ward') && !c.economy.equipped.length;
        c.sellers.active = firstVisit(phase === 'counter' ? 'greet' : phase === 'equip' ? 'equip' : received ? 'bought' : 'goods');
        c.sellers.nextTools = c.day+2;
      }
    }
    const s = c.sellers;
    if (c.phase !== 'open') { s.active=null; s.held=null; s.plan=null; return s; }
    if (!s.stockVersion) {
      if (s.day===c.day) { expandSavedVisit(c,s.active); expandSavedVisit(c,s.plan); }
      s.stockVersion=2;
    }
    if (s.day === c.day) return s;
    s.day=c.day; s.active=null; s.held=null; s.plan=null;
    if (c.day === 1 || !s.introduced) return s;
    let seller, goods;
    if (c.day >= (s.nextTools || 3)) {
      seller='artificer';
      goods=tools(extraTools(c,[]));
      if (c.economy.furnace<2) goods.push(item('furnace','upgrade'));
      s.nextTools=c.day+2+Math.floor(Math.random()*2);
    } else {
      const eligible=Object.keys(merchants).filter(id=>merchants[id].pack && c.day>=merchants[id].fromDay);
      const others=eligible.filter(id=>id!==s.lastOther);
      const pool=others.length?others:eligible;
      if (!pool.length) return s;
      seller=pool[Math.floor(Math.random()*pool.length)];
      s.lastOther=seller;
      goods=merchants[seller].pack(c);
    }
    if (goods.length) s.plan={after:1+Math.floor(Math.random()*3),seller,goods};
    return s;
  }
  function ready(c) {
    const s=c.sellers;
    if (!s || s.active || c.activeId || c.phase!=='open') return false;
    if (!s.introduced) return closed(c)+c.history.reduce((n,d)=>n+(d.completed||0)+(d.failed||0),0)>=2;
    return !!s.plan && closed(c)>=s.plan.after;
  }
  function change(c,action,index) {
    const s=c.sellers,a=s.active;
    if (c.phase!=='open') return false;
    if (action==='arrive' && ready(c)) {
      if (!s.introduced) {
        s.active=firstVisit('greet'); s.nextTools=c.day+2+Math.floor(Math.random()*2);
      } else {
        s.active={seller:s.plan.seller,goods:s.plan.goods,source:'visit',phase:'goods',selected:0}; s.plan=null;
      }
    } else if (action==='call' && !a && c.economy.stock[0]<=1) {
      s.active={seller:'herbalist',source:'delivery',phase:'goods',goods:[item('material',0)],selected:0};
    } else if (action==='recall' && !a && s.held) {
      s.active={seller:'artificer',source:'held',phase:'goods',goods:[s.held],selected:0};
    } else if (action==='show' && a?.phase==='greet') {
      s.introduced=true; a.phase='goods';
    } else if (action==='select' && a?.phase==='goods' && Number.isInteger(index) && a.goods[index]) {
      a.selected=index;
    } else if (action==='hold' && a?.source==='first' && a.phase==='goods' && !c.economy.tools.includes(a.goods[a.selected].id)) {
      s.held=a.goods[a.selected]; s.active=null; s.introduced=true;
    } else if (action==='equip' && a?.phase==='bought') {
      a.phase='equip';
    } else if (action==='leave' && a) {
      if (a.source==='first') s.introduced=true;
      s.active=null;
    } else return false;
    return true;
  }
  function offered(c,kind,id) {
    const a=c.sellers?.active,good=a?.goods[a.selected];
    return c.phase==='open' && a?.phase==='goods' && good?.kind===kind && (kind==='furnace'||good.id===id);
  }
  function price(c,kind,id,base) {
    const a=c.sellers?.active;
    return kind==='material' && id===1 && a?.seller==='herbalist' && a.source==='visit' ? base-6 : base;
  }
  function bought(c,kind,id) {
    const s=c.sellers,a=s?.active;
    if (kind!=='tool'||!a) return;
    if (s.held?.id===id) s.held=null;
    if (['held','first'].includes(a.source)) {a.phase='bought'; s.introduced=true;}
  }
  window.AlchemyCounterTrade={merchants,ensure,ready,change,offered,price,bought};
})();
