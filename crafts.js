/* Optional, self-funded products. Never creates a commission or supplies guest material. */
(function(root){
 'use strict';
 const defs=[
  {id:'bird',name:'机关鸟',material:'机关鸟器料',price:90,multiplier:1.8,atlas:'bird',customerId:'courier-shen',need:'机关鸟',reason:'山路不通，想买一只送信过山的机关鸟。',forms:["传话木雀", "驿路木鸽", "展翼木鸽", "铜翼信鸽", "长尾信隼", "展翼信隼", "双筒信燕", "复翼信使", "驮篮木鹤", "远驿信鹤", "巡天信鹤"]},
  {id:'lion',name:'守门石狮',material:'石狮器料',price:110,multiplier:2,atlas:'lion',customerId:'clothier-lu',need:'守门石狮',reason:'布庄夜里无人看守，想添一头能认门的石狮。',forms:["警门石兽", "守院石狮", "巡门石狮", "抬爪灵狮", "镇门踏珠狮", "伏地护狮", "镇宅立狮", "守院双镇狮", "探路石狮", "镇关伏狮", "门庭护法狮"]},
  {id:'home',name:'随身洞府',material:'洞府器料',price:220,multiplier:3,atlas:'home',customerId:'traveller-lin',need:'随身洞府',reason:'远行借宿总不方便，想买一处能随身带走的住处。',forms:["栖身石屋", "靠山小屋", "安居小院", "双间合院", "临岩居", "月门小院", "连桥居", "重楼人家", "临崖小筑", "三合院", "方寸家园"]},
  {id:'beast',name:'机关驮兽',material:'驮兽器料',price:130,multiplier:2.2,atlas:'beast',customerId:'merchant-zhou',need:'机关驮兽',reason:'山路运货费人，想买一头能驮箱笼的机关兽。',forms:["驮包木牛", "双篓木牛", "架货木牛", "双箱铜牛", "长脚驮牛", "驮桶机关牛", "辎重机关牛", "遮雨驮牛", "越岭驮兽", "重载机关牛", "远行辎重兽"]},
  {id:'tower',name:'守御建筑',material:'守御器料',price:180,multiplier:2.6,atlas:'tower',customerId:'watch-qin',need:'守御建筑',reason:'夜巡缺少望哨，想买一座能示警的缩形塔楼。',forms:["示警石标", "露台望哨", "梯木哨塔", "石基望楼", "木栅关门", "石拱门楼", "护关大门", "双台关隘", "四角石寨", "山关重垒", "方寸城塞"]},
  {id:'spring',name:'石泉水脉',material:'石泉器料',price:120,multiplier:2.1,atlas:'spring',customerId:'farmer-lu',need:'石泉水脉',reason:'旱时取水不便，想买一处能出清泉的石台。',forms:["滴泉石", "双眼泉台", "裂岩泉池", "双瀑石拱", "上下叠泉", "引水石渠", "三池连泉", "石门双池", "环岩水库", "三瀑流泉", "方寸水脉"]}
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
 function quote(c,id){const o=c.economy?.craftMarket?.offer,p=c.economy?.pills?.find(p=>p.id===id);if(c.phase!=='open'||!o||o.status!=='waiting'||c.economy.craftMarket.day!==c.day||!p||p.craftKind!==o.kind||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn>100||!Number.isFinite(p.yuanBonus||0)||p.turn<o.minTurn)return {ok:false};const mold=c.economy?.equipped?.includes('craft_mold')?1.12:1;return {ok:true,pill:p,payout:Math.ceil((p.value+(p.yuanBonus||0))*(1+o.bonusRate)*mold),offer:o};}
 const api={defs,turns,get,stage,name,ensure,quote,atlas:id=>'assets/crafts/'+id+'.webp'};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlchemyCrafts=api;
})(typeof window!=='undefined'?window:globalThis);
