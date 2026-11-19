(function(root){
'use strict';
const TOOL_DEFS=[
{id:'seal',name:'镇炉印',price:240,day:1,description:'每炉首次炸炉改为受损。'},
{id:'ward',name:'避火佩',price:180,day:1,description:'本炉基础炸炉概率降低10%（相对值）。'},
{id:'stone',name:'调息盘',price:220,day:2,description:'非炸炉权重：维持5→3，成功12→14。'},
{id:'lucky',name:'鸣金铃',price:320,day:3,description:'非炸炉大成功权重2→4，不直接降低炸炉率。'},
{id:'chain',name:'双仪环',price:420,day:4,description:'每连续两次成功或大成功，额外升一转；维持与受损打断连续。'},
{id:'repair',name:'淬火盏',price:480,day:5,description:'每次真实受损使本炉炸炉概率相对降低15%，最多降低60%；换炉清零。'},
{id:'phoenix',name:'返生鼎符',price:650,day:6,description:'每炉抵挡一次炸炉，维持转数但药力损失40%；此损值系数持续到收丹。'}];
const PRICES=[18,42],TOOLS=Object.fromEntries(TOOL_DEFS.map(t=>[t.id,t.price])),UPGRADES=[0,360,480];
const CONSIGNMENT_MAX_DAY=30;
const CONSIGNMENT_TIERS=[{id:'cabinet',name:'普通药柜',bonusRate:.10,waitDays:2,minDay:6},{id:'premium',name:'精品药柜',bonusRate:.18,waitDays:3,minDay:6},{id:'rare',name:'稀珍药柜',bonusRate:.28,waitDays:4,minDay:6},{id:'town',name:'镇坊展柜',bonusRate:.50,waitDays:7,minDay:6}];
const EQUIP_SLOTS=3;
function equippedIds(value){return [...new Set(Array.isArray(value)?value:value?[value]:[])].filter(id=>TOOL_DEFS.some(tool=>tool.id===id)).slice(0,EQUIP_SLOTS);}
function hasTool(value,id){return equippedIds(value).includes(id);}
function toolRisk(value,pill){let factor=1;if(hasTool(value,'ward'))factor*=.9;if(hasTool(value,'repair'))factor*=Math.max(.4,1-.15*Math.min(4,pill?.scars||0));return factor;}
function outcomeWeights(value){return {big:hasTool(value,'lucky')?4:2,success:hasTool(value,'stone')?14:12,hold:hasTool(value,'stone')?3:5,damage:2};}
function ensure(c){if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0],tools:[],equipped:null,furnace:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};if(c.economy.pills===undefined)c.economy.pills=[];if(!Array.isArray(c.economy.consignments))c.economy.consignments=[];if(!Number.isInteger(c.economy.consignmentSeq))c.economy.consignmentSeq=1;if(c.selfOrder!==undefined)delete c.selfOrder;delete c.economy.selfCount;if(Array.isArray(c.economy.pills))for(const pill of c.economy.pills){if(!pill||typeof pill!=='object')continue;delete pill.self;delete pill.source;delete pill.owner;}c.economy.equipped=equippedIds(c.economy.equipped);return c.economy;}
function recordCash(c,kind,before,reference){
  root.AlchemyTelemetry?.cash?.(c,kind,before,reference);
}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='material'){if(!Number.isInteger(id)||id<0||id>=PRICES.length)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id)||(c.day||1)<TOOL_DEFS.find(t=>t.id===id).day)return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;recordCash(c,kind,e.coins+price,id??e.furnace);return true;}
function credit(c,n,label,reference){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';recordCash(c,label,e.coins-n,reference);return n;}
function fee(o){return 30+Math.round(o.target*.15);}
function excessValue(o,pills){return Math.max(0,Math.round(pills.reduce((n,p)=>n+grossValue(p),0)-o.target));}
function commissionReward(o,pills){return fee(o)+excessValue(o,pills);}
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;o.returned=0;o.excess=excessValue(o,pills);o.reward=commissionReward(o,pills);return credit(c,o.reward,'委托工钱与超额补价',o.id);}
function grossValue(pill){
  return Math.round(pill.value + (Number.isFinite(pill.yuanBonus) ? pill.yuanBonus : 0));
}
function saleValue(c,pill){
  return Math.max(0, grossValue(pill) - (pill.materialAdvance || 0));
}
function storePill(c,p,order){const e=ensure(c),id=p.id;if(typeof id!=='string'||!id||!Array.isArray(e.pills)||e.pills.some(x=>x?.id===id)||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;e.pills.push({...(typeof p.appearance==='string'?{appearance:p.appearance}:{}),id,...(p.materialAdvance ? {materialAdvance:p.materialAdvance} : {}),day:c.day,value:p.value,yuanBonus:Number.isFinite(p.yuanBonus)?p.yuanBonus:0,turn:p.turn,quality:p.quality,...(Number.isFinite(p.baseValue)?{baseValue:p.baseValue}:{}),nature:p.nature||order?.nature||'neutral'});e.last='丹药已收入丹匣，可保留、提交或处理';return true;}
function sale(c,id){const e=ensure(c);if(typeof id!=='string'||!Array.isArray(e.pills))return false;const index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index];if(!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;const n=saleValue(c,p);e.pills.splice(index,1);e.sold++;return credit(c,n,'丹匣成丹出售',id);}
function consignmentTier(p){const turn=Number(p?.turn)||1;return CONSIGNMENT_TIERS[turn>=60?3:turn>=30?2:turn>=15?1:0];}
function consignmentQuote(c,p){const tier=consignmentTier(p),base=saleValue(c,p),gross=base*(1+tier.bonusRate);return {tier:tier.id,tierName:tier.name,bonusRate:tier.bonusRate,waitDays:tier.waitDays,basePayout:base,guaranteedPayout:Math.ceil(gross-1e-9),settleDay:(Number(c?.day)||1)+tier.waitDays};}
function consignmentEligibility(c,p){const e=ensure(c),q=consignmentQuote(c,p),listed=e.consignments.filter(x=>x?.status==='listed');if(q.basePayout===0)return {ok:false,reason:'抵清料款后无余款可寄售。',quote:q};if((Number(c?.day)||1)<6)return {ok:false,reason:'第6天开放寄售柜。',quote:q};if(listed.length>=3)return {ok:false,reason:'寄售柜已满，最多同时寄售3颗丹药。',quote:q};if(q.settleDay>CONSIGNMENT_MAX_DAY)return {ok:false,reason:'回款日超过本局经营结束，当前不能寄售。',quote:q};return {ok:true,reason:'',quote:q};}
function consign(c,id){const e=ensure(c),index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index],eligibility=consignmentEligibility(c,p);if(!eligibility.ok)return false;const q=eligibility.quote,snapshot={...p},entry={id:'consignment-'+(e.consignmentSeq++),pillSnapshot:snapshot,listedDay:c.day,settleDay:q.settleDay,tier:q.tier,tierName:q.tierName,bonusRate:q.bonusRate,guaranteedPayout:q.guaranteedPayout,status:'listed'};e.pills.splice(index,1);e.consignments.push(entry);e.last='已寄售，'+q.waitDays+'天后回款 '+q.guaranteedPayout+' 铜钱';return entry;}
function settleConsignments(c){const e=ensure(c),paid=[];for(const entry of e.consignments){if(entry?.status!=='listed'||entry.settleDay>(Number(c?.day)||1))continue;entry.status='paid';entry.paidDay=c.day;credit(c,entry.guaranteedPayout,'寄售回款',entry.id);paid.push(entry);}return paid;}
const api={recordCash,excessValue,commissionReward,saleValue,storePill,EQUIP_SLOTS,equippedIds,hasTool,TOOL_DEFS,toolRisk,outcomeWeights,PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale,consignmentTier,consignmentQuote,consignmentEligibility,consign,settleConsignments};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
