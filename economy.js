(function(root){
'use strict';
const Crafts=root.AlchemyCrafts||(typeof require==='function'?require('./crafts.js'):null);
const TOOL_DEFS=[
{id:'seal',name:'镇炉印',price:240,day:1,description:'每炉首次炸炉改为受损。',school:'shared'},
{id:'ward',name:'避火佩',price:180,day:1,description:'本炉基础炸炉概率降低10%（相对值）。',school:'shared'},
{id:'stone',name:'调息盘',price:220,day:1,description:'非炸炉权重：维持5→3，成功12→14。',school:'shared'},
{id:'lucky',name:'鸣金铃',price:320,day:1,description:'非炸炉大成功权重2→4，不直接降低炸炉率。',school:'shared'},
{id:'chain',name:'双仪环',price:420,day:4,description:'每连续两次成功或大成功，额外升一转；维持与受损打断连续。',school:'shared'},
{id:'repair',name:'淬火盏',price:480,day:5,description:'每次真实受损使本炉炸炉概率相对降低15%，最多降低60%；换炉清零。',school:'shared'},
{id:'phoenix',name:'返生鼎符',price:650,day:6,description:'每炉抵挡一次炸炉，维持转数但药力损失40%；此损值系数持续到收丹。',school:'shared'},
{id:'breath_pearl',name:'纳息珠',price:380,day:3,description:'收丹前将少量未兑现炉险转为基础药力。',school:'shared'},
{id:'guard_casket',name:'护胆匣',price:360,day:2,description:'每炉第一次受损时，转数损失减半。',school:'stable'},
{id:'still_incense',name:'定息香',price:400,day:3,description:'维持后，下一次炼制的风险增长降低。',school:'stable'},
{id:'hearth_pin',name:'安炉钉',price:420,day:4,description:'新炉前几次炼制的风险增长降低。',school:'stable'},
{id:'cooling_tag',name:'收火签',price:460,day:5,description:'达到委托目标后收丹，获得稳定报酬加成。',school:'stable'},
{id:'quiet_lamp',name:'静火盏',price:500,day:6,description:'连续安全结果后，下一次炸炉权重降低。',school:'stable'},
{id:'pulse_ring',name:'守脉环',price:540,day:7,description:'九转前不发生风险突增。',school:'stable'},
{id:'steady_talisman',name:'稳元符',price:580,day:8,description:'九转归元前保留一次最低药力保障。',school:'stable'},
{id:'slow_plate',name:'缓升盘',price:620,day:9,description:'炉险增长变慢，但高转数药力倍率略低。',school:'stable'},
{id:'pressure_plate',name:'炉压盘',price:420,day:6,description:'提高炸炉权重，并提高风险药力积累。',school:'overload'},
{id:'red_nail',name:'赤焰钉',price:460,day:7,description:'达到指定转数后进一步提高炸炉权重。',school:'overload'},
{id:'fissure_cone',name:'裂炉锥',price:500,day:8,description:'炉险超过阈值后，成功结果获得额外药力。',school:'overload'},
{id:'reverse_lamp',name:'逆命灯',price:560,day:9,description:'炸炉被保护或转为受损时，保留部分风险倍率。',school:'overload'},
{id:'scorch_seal',name:'焦痕印',price:600,day:10,description:'每次受损提高下一次九转归元收益。',school:'overload'},
{id:'ignite_pearl',name:'引爆珠',price:640,day:11,description:'连续安全结果越多，下一次风险爆发越强。',school:'overload'},
{id:'risk_ruler',name:'归险尺',price:700,day:12,description:'将部分炸炉概率转为归元药力倍率，达到上限后失效。',school:'overload'},
{id:'ash_contract',name:'灰烬契',price:760,day:13,description:'高炉险收丹时，超额药力获得额外报酬。',school:'overload'},
{id:'crack_bowl',name:'裂纹钵',price:390,day:4,description:'受损时积累额外药力。',school:'scar'},
{id:'reverse_fire',name:'逆火符',price:430,day:5,description:'受损后下一次成功获得额外转数。',school:'scar'},
{id:'broken_link',name:'断续索',price:470,day:6,description:'受损后的维持结果不会清除成功连段。',school:'scar'},
{id:'scar_ruler',name:'伤痕尺',price:520,day:7,description:'受损次数越多，后续成功收益越高。',school:'scar'},
{id:'ash_box',name:'灰烬匣',price:560,day:8,description:'炸炉后保留部分基础药力到下一炉。',school:'scar'},
{id:'ember_tray',name:'余火盘',price:600,day:9,description:'带受损记录的丹药出售或寄售时提高价值。',school:'scar'},
{id:'failed_contract',name:'败炉契',price:640,day:10,description:'委托失败时返还部分未用材料，并降低下一单目标。',school:'scar'},
{id:'pattern_tray',name:'回纹托',price:680,day:11,description:'受损后收丹，下一炉获得一次风险缓冲。',school:'scar'},
{id:'market_tag',name:'市价签',price:360,day:4,description:'自有丹药出售价格提高。',school:'business'},
{id:'medicine_seal',name:'药商印',price:420,day:5,description:'委托超额药力的报酬提高。',school:'business'},
{id:'余料囊',name:'余料囊',price:460,day:6,description:'委托结算时返还部分未用材料。',school:'business'},
{id:'consign牌',name:'寄售牌',price:500,day:7,description:'寄售保底价和溢价提高。',school:'business'},
{id:'craft_mold',name:'造物模',price:540,day:8,description:'其他产物的成品基础价值提高。',school:'business'},
{id:'material_scale',name:'工料秤',price:580,day:9,description:'购买造物原料时降低成本。',school:'business'},
{id:'client_contract',name:'客契册',price:620,day:10,description:'满足指定药力或药性要求时提高报酬。',school:'business'},
{id:'stock_talisman',name:'进货符',price:660,day:11,description:'商人来访时增加商品或提高高价值商品出现率。',school:'business'}];
const PRICES=[18,42],TOOLS=Object.fromEntries(TOOL_DEFS.map(t=>[t.id,t.price])),UPGRADES=[0,360,480];
const CONSIGNMENT_MAX_DAY=30;
const CONSIGNMENT_TIERS=[{id:'cabinet',name:'普通药柜',bonusRate:.10,waitDays:2,minDay:6},{id:'premium',name:'精品药柜',bonusRate:.18,waitDays:3,minDay:6},{id:'rare',name:'稀珍药柜',bonusRate:.28,waitDays:4,minDay:6},{id:'town',name:'镇坊展柜',bonusRate:.50,waitDays:7,minDay:6}];
const EQUIP_SLOTS=3;
function equippedIds(value){return [...new Set(Array.isArray(value)?value:value?[value]:[])].filter(id=>TOOL_DEFS.some(tool=>tool.id===id)).slice(0,EQUIP_SLOTS);}
function hasTool(value,id){return equippedIds(value).includes(id);}
function toolRisk(value,pill){
 let factor=1,turn=Number(pill?.turn)||1;
 if(hasTool(value,'ward'))factor*=.9;
 if(hasTool(value,'repair'))factor*=Math.max(.4,1-.15*Math.min(4,pill?.scars||0));
 if(hasTool(value,'hearth_pin')&&(Number(pill?.refineCount)||0)<3)factor*=.72;
 if(hasTool(value,'pressure_plate'))factor*=1.18;
 if(hasTool(value,'red_nail')&&turn>=6)factor*=1.22;
 if(hasTool(value,'fissure_cone')&&turn>=9)factor*=1.12;
 if(hasTool(value,'quiet_lamp')&&((Number(pill?.safeStreak)||0)>=2||(turn>=3&&turn%3===0)))factor*=.9;
 if(hasTool(value,'pulse_ring')&&turn<9)factor*=.68;
 if(hasTool(value,'slow_plate'))factor*=.92;
 return Math.max(.35,Math.min(1.8,factor));
}
function outcomeWeights(value){return {big:hasTool(value,'lucky')?4:2,success:hasTool(value,'stone')?14:12,hold:hasTool(value,'stone')?3:5,damage:2};}
function ensure(c){if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0],tools:[],equipped:null,furnace:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};if(c.economy.pills===undefined)c.economy.pills=[];if(!Array.isArray(c.economy.consignments))c.economy.consignments=[];if(!Number.isInteger(c.economy.consignmentSeq))c.economy.consignmentSeq=1;if(!Number.isFinite(c.economy.nextOrderTargetPenalty))c.economy.nextOrderTargetPenalty=0;if(c.selfOrder!==undefined)delete c.selfOrder;delete c.economy.selfCount;if(Array.isArray(c.economy.pills))for(const pill of c.economy.pills){if(!pill||typeof pill!=='object')continue;delete pill.self;delete pill.source;delete pill.owner;}c.economy.equipped=equippedIds(c.economy.equipped);Crafts.ensure(c);return c.economy;}
function feel(event,detail={}){if(typeof window!=='undefined')window.AlchemyGameFeel?.emit(event,detail);}
function recordCash(c,kind,before,reference){
  root.AlchemyTelemetry?.cash?.(c,kind,before,reference);
}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='craftMaterial'){const d=Crafts.get(id);if(!d||e.craftStock[id]>=999)return false;price=d.price*(hasTool(e.equipped,'material_scale')?.85:1);}else if(kind==='material'){if(!Number.isInteger(id)||id<0||id>=PRICES.length)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id)||(c.day||1)<TOOL_DEFS.find(t=>t.id===id).day)return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;price=Math.max(1,Math.round(root.AlchemyCounterTrade?.price(c,kind,id,price)??price));if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='craftMaterial')e.craftStock[id]++;else if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;recordCash(c,kind,e.coins+price,id??e.furnace);feel('purchase',{kind,id,price,tier:kind==='furnace'?'medium':'small'});return true;}
function credit(c,n,label,reference){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';recordCash(c,label,e.coins-n,reference);return n;}
function fee(o){return 30+Math.round(o.target*.15);}
function excessValue(o,pills){return Math.max(0,Math.round(pills.reduce((n,p)=>n+grossValue(p),0)-o.target));}
function commissionReward(o,pills){return fee(o)+excessValue(o,pills);}
function commissionRewardWithTools(c,o,pills){
 const total=pills.reduce((n,p)=>n+grossValue(p),0),excess=Math.max(0,total-(o?.target||0));
 let reward=fee(o)+excess;
 const e=ensure(c);
 if(hasTool(e.equipped,'medicine_seal')&&excess>0)reward+=Math.round(excess*.12);
 if(hasTool(e.equipped,'cooling_tag'))reward=Math.round(reward*1.06);
 const nature=o?.nature||'neutral',matching=pills.length>0&&pills.every(p=>(p?.nature||'neutral')===nature);
 if(hasTool(e.equipped,'client_contract')&&total>=o.target&&matching)reward=Math.round(reward*1.08);
 if(hasTool(e.equipped,'ash_contract')&&Number(o?.riskPeak||0)>=.45&&excess>0)reward+=Math.round(excess*.10);
 return reward;
}
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;if(hasTool(e.equipped,'余料囊')&&leftover>0){e.herbs.neutral+=Math.min(1,leftover);o.materialPouchBonus=Math.min(1,leftover);}o.riskPeak=Math.max(Number(o.riskPeak)||0,...pills.map(p=>Number(p?.riskPeak)||0));o.returned=0;o.excess=excessValue(o,pills);o.reward=commissionRewardWithTools(c,o,pills);return credit(c,o.reward,'委托工钱与超额补价',o.id);}
function grossValue(pill){
  return Math.round(pill.value + (Number.isFinite(pill.yuanBonus) ? pill.yuanBonus : 0));
}
function saleValue(c,pill){
  const e=ensure(c),rate=hasTool(e.equipped,'market_tag')?.08:0;
  const scarBonus=hasTool(e.equipped,'ember_tray')&&pill?.scars? .08:0;
  return Math.max(0, Math.round(grossValue(pill)*(1+rate+scarBonus) - (pill.materialAdvance || 0)));
}
function storePill(c,p,order){const e=ensure(c),id=p.id;if(typeof id!=='string'||!id||!Array.isArray(e.pills)||e.pills.some(x=>x?.id===id)||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;if(p.craftKind&&!Crafts.get(p.craftKind))return false;e.pills.push({...(p.craftKind?{craftKind:p.craftKind,craftCost:p.craftCost||Crafts.get(p.craftKind).price}:{}),...(typeof p.appearance==='string'?{appearance:p.appearance}:{}),id,...(p.materialAdvance ? {materialAdvance:p.materialAdvance} : {}),day:c.day,value:p.value,yuanBonus:Number.isFinite(p.yuanBonus)?p.yuanBonus:0,turn:p.turn,quality:p.quality,...(Number.isFinite(p.baseValue)?{baseValue:p.baseValue}:{}),...(Number.isFinite(p.riskPeak)?{riskPeak:p.riskPeak}:{}),...(Number.isInteger(p.scars)&&p.scars>0?{scars:p.scars}:{}),nature:p.nature||order?.nature||'neutral'});e.last=p.craftKind?'造物已收纳，可保留、出售或等待求购':'丹药已收入丹匣，可保留、提交或处理';return true;}
function sale(c,id){const e=ensure(c);if(typeof id!=='string'||!Array.isArray(e.pills))return false;const index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index];if(!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;const n=saleValue(c,p);e.pills.splice(index,1);e.sold++;const ok=credit(c,n,p.craftKind?'造物出售':'丹匣成丹出售',id);if(ok)feel('sell',{id,value:n,tier:'medium'});return ok;}
function consignmentTier(p){const turn=Number(p?.turn)||1;return CONSIGNMENT_TIERS[turn>=60?3:turn>=30?2:turn>=15?1:0];}
function consignmentQuote(c,p){const tier=consignmentTier(p),base=saleValue(c,p),e=ensure(c),bonus=hasTool(e.equipped,'consign牌')?.10:0,gross=base*(1+tier.bonusRate+bonus);return {tier:tier.id,tierName:tier.name,bonusRate:tier.bonusRate+bonus,waitDays:tier.waitDays,basePayout:base,guaranteedPayout:Math.ceil(gross-1e-9),settleDay:(Number(c?.day)||1)+tier.waitDays};}
function consignmentEligibility(c,p){const e=ensure(c),q=consignmentQuote(c,p),listed=e.consignments.filter(x=>x?.status==='listed');if(q.basePayout===0)return {ok:false,reason:'抵清料款后无余款可寄售。',quote:q};if((Number(c?.day)||1)<6)return {ok:false,reason:'第6天开放寄售柜。',quote:q};if(listed.length>=3)return {ok:false,reason:'寄售柜已满，最多同时寄售3颗丹药。',quote:q};if(q.settleDay>CONSIGNMENT_MAX_DAY)return {ok:false,reason:'回款日超过本局经营结束，当前不能寄售。',quote:q};return {ok:true,reason:'',quote:q};}
function consign(c,id){const e=ensure(c),index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index],eligibility=consignmentEligibility(c,p);if(!eligibility.ok)return false;const q=eligibility.quote,snapshot={...p},entry={id:'consignment-'+(e.consignmentSeq++),pillSnapshot:snapshot,listedDay:c.day,settleDay:q.settleDay,tier:q.tier,tierName:q.tierName,bonusRate:q.bonusRate,guaranteedPayout:q.guaranteedPayout,status:'listed'};e.pills.splice(index,1);e.consignments.push(entry);e.last='已寄售，'+q.waitDays+'天后回款 '+q.guaranteedPayout+' 铜钱';feel('consign',{id,pill:p,quote:q,tier:'medium'});return entry;}
function settleConsignments(c){const e=ensure(c),paid=[];for(const entry of e.consignments){if(entry?.status!=='listed'||entry.settleDay>(Number(c?.day)||1))continue;entry.status='paid';entry.paidDay=c.day;credit(c,entry.guaranteedPayout,'寄售回款',entry.id);paid.push(entry);}if(paid.length)feel('paid',{count:paid.length,total:paid.reduce((n,x)=>n+x.guaranteedPayout,0),tier:'medium'});return paid;}
function craftSale(c,id){const e=ensure(c),q=Crafts.quote(c,id);if(!q.ok)return false;const index=e.pills.findIndex(p=>p.id===id);if(index<0)return false;e.pills.splice(index,1);e.craftMarket.offer.status='sold';e.sold++;credit(c,q.payout,'造物求购',id);feel('sell',{id,value:q.payout,tier:'medium'});return true;}
function dismissCraftOffer(c){const o=ensure(c).craftMarket.offer;if(!o||o.status!=='waiting')return false;o.status='declined';return true;}
const api={craftSale,dismissCraftOffer,recordCash,excessValue,commissionReward,commissionRewardWithTools,saleValue,storePill,EQUIP_SLOTS,equippedIds,hasTool,TOOL_DEFS,toolRisk,outcomeWeights,PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale,consignmentTier,consignmentQuote,consignmentEligibility,consign,settleConsignments};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
