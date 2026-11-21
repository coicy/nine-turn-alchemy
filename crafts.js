/* Optional, self-funded products. Never creates a commission or supplies guest material. */
(function(root){
 'use strict';
 const defs=[
  {id:'bird',name:'机关鸟',material:'机关鸟器料',price:90,multiplier:1.8,atlas:'bird',customerId:'courier-shen',need:'驿路信鸟',reason:'山路不通，想买一只送信过山的机关鸟。',forms:["传话木雀", "驿路信鸟", "铜羽木雀", "驮信铜鸽", "逐风铜隼", "夜航铜隼", "银翼信隼", "云翼灵禽", "金翎信使", "天阙灵使", "巡天信使"]},
  {id:'lion',name:'守门石狮',material:'石狮器料',price:110,multiplier:2,atlas:'lion',customerId:'clothier-lu',need:'守院石狮',reason:'布庄夜里无人看守，想添一头能认门的石狮。',forms:["警门小狮", "守院石狮", "醒目灵狮", "巡夜灵狮", "踏珠护狮", "镇宅雄狮", "镇门狮台", "护院狮坛", "守坊狮阁", "镇城狮座", "护坊狮城"]},
  {id:'home',name:'随身洞府',material:'洞府器料',price:220,multiplier:3,atlas:'home',customerId:'traveller-lin',need:'安居小院',reason:'远行借宿总不方便，想买一处能随身带走的住处。',forms:["栖身石屋", "安居小院", "行旅小院", "依岩山居", "层岩洞府", "方寸庭院", "飞桥洞府", "悬空院落", "云台仙居", "山中别府", "方寸山门"]},
  {id:'beast',name:'机关驮兽',material:'驮兽器料',price:130,multiplier:2.2,atlas:'beast',customerId:'merchant-zhou',need:'驮箱铜牛',reason:'山路运货费人，想买一头能驮箱笼的机关兽。',forms:["运货木牛", "驮箱木牛", "铜首驮牛", "驮箱铜牛", "重载铜牛", "山行机关兽", "行商辎重兽", "随行货栈", "驮楼机关兽", "行商宝楼", "万里机关楼"]},
  {id:'tower',name:'守御建筑',material:'守御器料',price:180,multiplier:2.6,atlas:'tower',customerId:'watch-qin',need:'巡望哨塔',reason:'夜巡缺少望哨，想买一座能示警的缩形塔楼。',forms:["示警石台", "巡望哨塔", "山道望楼", "护路岗楼", "巡关高楼", "护寨门楼", "守关重楼", "双阙堡垒", "四方城寨", "镇关城堡", "方寸城塞"]},
  {id:'spring',name:'石泉水脉',material:'石泉器料',price:120,multiplier:2.1,atlas:'spring',customerId:'farmer-lu',need:'清泉台',reason:'旱时取水不便，想买一处能出清泉的石台。',forms:["滴泉石", "清泉台", "润石泉池", "双泉石台", "叠泉灵池", "月环泉台", "飞桥水池", "听泉水阁", "三叠泉府", "活水仙府", "方寸水境"]}
 ];
 const turns=Object.freeze([1,3,5,9,10,15,30,45,60,80,100]);
 const get=id=>defs.find(d=>d.id===id),stage=turn=>Math.max(0,turns.filter(t=>turn>=t).length-1);
 function name(p){const d=get(p?.craftKind);return d?d.forms[Math.max(0,stage(p.turn||1))]:'丹药';}
 function ensure(c){const e=c.economy;if(!e)return;e.craftStock ||= {};for(const d of defs)if(!Number.isInteger(e.craftStock[d.id])||e.craftStock[d.id]<0)e.craftStock[d.id]=0;
  if(e.craftMarket?.day!==c.day){
   let hash=0;for(const x of (c.orders?.[0]?.client||'丹坊'))hash=(hash*31+x.charCodeAt(0))>>>0;
   const chance=(hash+c.day*37)%100,d=defs[(hash+c.day)%defs.length];
   e.craftMarket={day:c.day,offer:c.day>=3&&c.phase==='open'&&chance<28?{kind:d.id,customerId:d.customerId,minTurn:3,bonusRate:.25,status:'waiting'}:null};
  }if(c.phase!=='open'&&e.craftMarket.offer?.status==='waiting')e.craftMarket.offer.status='expired';return e;
 }
 function quote(c,id){const o=c.economy?.craftMarket?.offer,p=c.economy?.pills?.find(p=>p.id===id);if(c.phase!=='open'||!o||o.status!=='waiting'||c.economy.craftMarket.day!==c.day||!p||p.craftKind!==o.kind||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn>100||!Number.isFinite(p.yuanBonus||0)||p.turn<o.minTurn)return {ok:false};return {ok:true,pill:p,payout:Math.ceil((p.value+(p.yuanBonus||0))*(1+o.bonusRate)),offer:o};}
 const api={defs,turns,get,stage,name,ensure,quote,atlas:id=>'assets/crafts-v207/'+id+'.png'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlchemyCrafts=api;
})(typeof window!=='undefined'?window:globalThis);
