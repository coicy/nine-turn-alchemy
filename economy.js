(function(root){
'use strict';
const TOOL_DEFS=[
{id:'seal',name:'镇炉印',price:240,day:1,description:'每炉首次炸炉改为受损。'},
{id:'needle',name:'生纹针',price:300,day:1,description:'每炉首次成功或大成功，必定显现一道未持有的基础纹。自动触发。'},
{id:'ward',name:'避火佩',price:180,day:1,description:'本炉基础炸炉概率降低10%（相对值）。'},
{id:'stone',name:'调息盘',price:220,day:2,description:'非炸炉权重：维持5→3，成功12→14。'},
{id:'lucky',name:'鸣金铃',price:320,day:3,description:'非炸炉大成功权重2→4，不直接降低炸炉率。'},
{id:'chain',name:'双仪环',price:420,day:4,description:'每连续两次成功或大成功，额外升一转；维持与受损打断连续。'},
{id:'repair',name:'淬火盏',price:480,day:5,description:'每次真实受损使本炉炸炉概率相对降低15%，最多降低60%；换炉清零。'},
{id:'phoenix',name:'返生鼎符',price:650,day:6,description:'每炉抵挡一次炸炉，维持转数但丹值损失40%；此损值系数持续到收丹。'},
{id:'burn',name:'燃纹盏',price:360,day:2,description:'炸炉时自动消耗末道基础纹，改为维持；每炉最多两次。融合纹不消耗。'},
{id:'return',name:'回纹环',price:380,day:3,description:'每炉首次燃纹后，下一次成功自动补回所消耗的纹；满纹则顺延。'},
{id:'ash',name:'烬金印',price:400,day:3,description:'每次燃纹，本炉丹值系数永久增加15%，最多两层；换炉清零。'},
{id:'fusion',name:'合璧镜',price:440,day:4,description:'融合后，下一次成功必显基础纹；每炉最多触发两次，不在同次炼化递归。'},
{id:'six',name:'六合盘',price:520,day:5,description:'持有4–5道纹时炸炉率相对降低15%；6道时降低30%。失去纹路即重算。'}];
const PRICES=[18,42,70],TOOLS=Object.fromEntries(TOOL_DEFS.map(t=>[t.id,t.price])),UPGRADES=[0,360,900];
const EQUIP_SLOTS=3;
function equippedIds(value){return [...new Set((Array.isArray(value)?value:value?[value]:[]).filter(id=>TOOLS[id]))].slice(0,EQUIP_SLOTS);}
function hasTool(value,id){return equippedIds(value).includes(id);}
function toolRisk(value,pill){let factor=1;if(hasTool(value,'ward'))factor*=.9;if(hasTool(value,'repair'))factor*=Math.max(.4,1-.15*Math.min(4,pill?.scars||0));if(hasTool(value,'six'))factor*=pill?.runes?.length>=6?.7:pill?.runes?.length>=4?.85:1;return factor;}
function outcomeWeights(value){return {big:hasTool(value,'lucky')?4:2,success:hasTool(value,'stone')?14:12,hold:hasTool(value,'stone')?3:5,damage:2};}
function ensure(c){if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0,0],tools:[],equipped:null,furnace:0,selfCount:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};c.economy.equipped=equippedIds(c.economy.equipped);return c.economy;}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='material'){if(!Number.isInteger(id)||id<0||id>2)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id)||(c.day||1)<TOOL_DEFS.find(t=>t.id===id).day)return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;return true;}
function credit(c,n,label){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';return n;}
function fee(o){return 30+Math.round(o.target*.15);}
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;o.returned=0;const bonus=Math.min(fee(o),pills.reduce((n,p)=>n+(p.quality||0)*3+Math.max(0,(p.turn||1)-4)*2+(p.runes?.length||0)*4,0));o.reward=fee(o)+bonus;return credit(c,o.reward,'委托工钱与加赏');}
function sale(c,p){const e=ensure(c);const floor=e.furnace>=2&&p.turn>=6?Math.round(p.value*.65):0;const n=Math.max(floor,Math.round(p.value*.55));e.sold++;return credit(c,n,'自炼成丹出售');}
const api={EQUIP_SLOTS,equippedIds,hasTool,TOOL_DEFS,toolRisk,outcomeWeights,PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
