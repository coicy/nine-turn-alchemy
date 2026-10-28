(function(root){
'use strict';
const PRICES=[18,42,70],TOOLS={seal:240,needle:300},UPGRADES=[0,360,900];
function ensure(c){if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0,0],tools:[],equipped:null,furnace:0,selfCount:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};return c.economy;}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='material'){if(!Number.isInteger(id)||id<0||id>2)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id))return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;return true;}
function credit(c,n,label){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';return n;}
function fee(o){return 30+Math.round(o.target*.15);}
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;o.returned=0;const bonus=Math.min(fee(o),pills.reduce((n,p)=>n+(p.quality||0)*3+Math.max(0,(p.turn||1)-4)*2+(p.runes?.length||0)*4,0));o.reward=fee(o)+bonus;return credit(c,o.reward,'委托工钱与加赏');}
function sale(c,p){const e=ensure(c);const floor=e.furnace>=2&&p.turn>=6?Math.round(p.value*.65):0;const n=Math.max(floor,Math.round(p.value*.55));e.sold++;return credit(c,n,'自炼成丹出售');}
const api={PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
