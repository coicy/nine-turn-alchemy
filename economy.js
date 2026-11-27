(function(root){
'use strict';
const Crafts=root.AlchemyCrafts||(typeof require==='function'?require('./crafts.js'):null);
const Catalog=root.AlchemyCustomerCatalog||(typeof require==='function'?require('./customer-catalog.js'):null);
function evaluateSpecialTrait(o,pills){
 if(!o?.arcId||!Array.isArray(pills)||!pills.length)return null;
 const stage=Catalog?.specialArcs?.[o.arcId]?.stages?.[o.arcStage];
 if(!stage?.traitRule)return null;
 const rule=stage.traitRule;
 let matched=false;
 if(rule==='unscarred')matched=pills.every(p=>(Number(p?.scars)||0)===0);
 else if(rule==='scarred')matched=pills.some(p=>(Number(p?.scars)||0)>0||(Number(p?.riskPeak)||0)>=.35);
 else if(rule==='highRisk')matched=pills.some(p=>(Number(p?.riskPeak)||0)>=.35||p?.nature==='warm'||(Number(p?.turn)||1)>=7);
 else if(rule==='excess')matched=excessValue(o,pills)>=24||pills.some(p=>(Number(p?.turn)||1)>=8);
 else if(rule==='coolNature')matched=pills.some(p=>p?.nature==='cool')||excessValue(o,pills)<=36;
 else if(rule==='highTurn')matched=pills.some(p=>(Number(p?.turn)||1)>=5);
 return matched?{bonus:Number(stage.traitBonus)||20,label:stage.traitLabel||'投其所好赏钱'}:null;
}
const TOOL_DEFS=[
{id:'seal',name:'镇炉印',price:240,day:1,description:'每炉首次炸炉，改为受损。',school:'shared'},
{id:'ward',name:'避火佩',price:180,day:1,description:'本炉炸炉率降低10%。',school:'shared'},
{id:'stone',name:'调息盘',price:220,day:1,description:'不炸炉时，维持减少、成功提高（基础成功率57%→67%）。',school:'shared'},
{id:'lucky',name:'鸣金铃',price:320,day:1,description:'不炸炉时，大成功概率大幅提高（基础9.5%→17.4%，不降炸炉率）。',school:'shared'},
{id:'chain',name:'双仪环',price:420,day:4,description:'每连续2次成功或大成功，当次额外多升1转；维持或受损打断连段。',school:'shared'},
{id:'repair',name:'淬火盏',price:480,day:5,description:'每次真实受损，本炉炸炉率降低15%，最多降60%（护丹转受损不计）。',school:'shared'},
{id:'phoenix',name:'返生鼎符',price:650,day:6,description:'每炉挡一次炸炉改为维持，但这颗丹药力永久×0.6。',school:'shared'},
{id:'breath_pearl',name:'纳息珠',price:380,day:3,description:'收丹时，将未兑现余火的20%转为药力（1~18点，造物无效）。',school:'shared'},
{id:'guard_casket',name:'护胆匣',price:360,day:2,description:'每炉首次受损不退转，药力仅降为×0.92。',school:'stable'},
{id:'still_incense',name:'定息香',price:400,day:3,description:'抽中维持后，下一次炼制的炸炉率降低28%。',school:'stable'},
{id:'hearth_pin',name:'安炉钉',price:420,day:4,description:'每炉前3次炼制，炸炉率降低28%。',school:'stable'},
{id:'cooling_tag',name:'收火签',price:460,day:5,description:'委托达成目标结算时，总报酬+6%。',school:'stable'},
{id:'quiet_lamp',name:'静火盏',price:500,day:6,description:'连续2次未受损，或处于3/6/9…倍转数时，炸炉率降低10%。',school:'stable'},
{id:'pulse_ring',name:'守脉环',price:540,day:7,description:'9转之前，炸炉率降低32%。',school:'stable'},
{id:'steady_talisman',name:'稳元符',price:580,day:8,description:'每炉首次满9转归元时，归元药力保底+12。',school:'stable'},
{id:'slow_plate',name:'缓升盘',price:620,day:9,description:'炸炉率始终降低8%，但30转起成丹药力降低8%。',school:'stable'},
{id:'pressure_plate',name:'炉压盘',price:420,day:6,description:'炸炉率提高18%，药力创新高时攒下的余火+18%。',school:'overload'},
{id:'red_nail',name:'赤焰钉',price:460,day:7,description:'6转起炸炉率提高22%；药力≥120时，创新高攒下的余火+22%。',school:'overload'},
{id:'fissure_cone',name:'裂炉锥',price:500,day:8,description:'炉险曾达30%后，成功时药力+5%（限3次）；药力≥180时余火+15%；9转起炸炉率+12%。',school:'overload'},
{id:'reverse_lamp',name:'逆命灯',price:560,day:9,description:'炸炉被挡或丹受损时，将当次风险值的35%攒入余火。',school:'overload'},
{id:'scorch_seal',name:'焦痕印',price:600,day:10,description:'每次真实受损，使本炉后续攒下的余火+8%，最多+32%。',school:'overload'},
{id:'ignite_pearl',name:'引爆珠',price:640,day:11,description:'每连续1次未受损，创新高攒下的余火+5%，最多+25%。',school:'overload'},
{id:'risk_ruler',name:'归险尺',price:700,day:12,description:'非护炉炼制时，将当前炸炉率的20%按2倍转为下次九转归元倍率（归元兑现后重置）；本炉累计转满30%后失效。',school:'overload'},
{id:'ash_contract',name:'灰烬契',price:760,day:13,description:'本单所交丹药炉险曾达45%，委托超额部分报酬+10%。',school:'overload'},
{id:'crack_bowl',name:'裂纹钵',price:390,day:4,description:'每次真实受损，余火直接+6。',school:'scar'},
{id:'reverse_fire',name:'逆火符',price:430,day:5,description:'真实受损后，下一次成功或大成功多升1转（不叠加）。',school:'scar'},
{id:'broken_link',name:'断续索',price:470,day:6,description:'装备双仪环时，抽中维持不会打断成功连段。',school:'scar'},
{id:'scar_ruler',name:'伤痕尺',price:520,day:7,description:'每次真实受损，按已受损次数攒余火（第1~4次分别+3/+6/+9/+12）。',school:'scar'},
{id:'ash_box',name:'灰烬匣',price:560,day:8,description:'炸炉后，下一炉开炉自带本炉25%药力作为初始余火。',school:'scar'},
{id:'ember_tray',name:'余火盘',price:600,day:9,description:'曾受损过的丹药，出售或寄售时基础售价+8%。',school:'scar'},
{id:'failed_contract',name:'败炉契',price:640,day:10,description:'委托失败时，每包未用客料返4铜钱，且次日委托目标降10%（最多降25%）。',school:'scar'},
{id:'pattern_tray',name:'回纹托',price:680,day:11,description:'曾受损的丹药收丹时，下一炉首炼免炸炉（每炉限1次，造物无效）。',school:'scar'},
{id:'market_tag',name:'市价签',price:360,day:4,description:'丹药出售或寄售时，基础售价+8%（造物无效）。',school:'business'},
{id:'medicine_seal',name:'药商印',price:420,day:5,description:'委托完成时，超出目标的药力额外多给12%报酬。',school:'business'},
{id:'material_pouch',name:'余料囊',price:460,day:6,description:'委托完成且有剩余客料时，额外获赠1包平性药材。',school:'business'},
{id:'consign_plate',name:'寄售牌',price:500,day:7,description:'丹药寄售时，到期回款溢价额外+10%。',school:'business'},
{id:'craft_mold',name:'造物模',price:540,day:8,description:'炉中造物出售或应约求购时，售价+12%。',school:'business'},
{id:'material_scale',name:'工料秤',price:580,day:9,description:'向商人购买造物器料时，价格打85折。',school:'business'},
{id:'client_contract',name:'客契册',price:620,day:10,description:'委托达标且所交丹药药性全部符合要求时，总报酬+8%。',school:'business'},
{id:'stock_talisman',name:'进货符',price:660,day:11,description:'装备在炉上时，法器商下次登门多带1件法器（5件→6件）。',school:'business'}];
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
const RISK_RULER=Object.freeze({share:.2,ratio:2,cap:.3});
function riskRulerShift(value,pill,rawRisk){
 if(!hasTool(value,'risk_ruler'))return 0;
 const converted=Math.max(0,Number(pill?.riskRulerConverted)||0);
 const remaining=Math.max(0,RISK_RULER.cap-converted);
 if(remaining<=1e-6)return 0;
 const raw=Math.max(0,Math.min(.95,Number(rawRisk)||0));
 if(raw<=0)return 0;
 return Math.min(remaining,raw*RISK_RULER.share);
}
function outcomeWeights(value){return {big:hasTool(value,'lucky')?4:2,success:hasTool(value,'stone')?14:12,hold:hasTool(value,'stone')?3:5,damage:2};}
const LEGACY_TOOL_IDS={'\u4f59\u6599\u56ca':'material_pouch','consign\u724c':'consign_plate'};
function migrateToolIds(list){return Array.isArray(list)?[...new Set(list.map(id=>LEGACY_TOOL_IDS[id]||id))]:list;}
function ensure(c){if(!c||typeof c!=='object')return null;if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0],tools:[],equipped:null,furnace:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};if(c.economy.pills===undefined)c.economy.pills=[];if(!Array.isArray(c.economy.consignments))c.economy.consignments=[];if(!Number.isInteger(c.economy.consignmentSeq))c.economy.consignmentSeq=1;if(!Number.isFinite(c.economy.nextOrderTargetPenalty))c.economy.nextOrderTargetPenalty=0;if(!Number.isFinite(c.economy.ritualCharge))c.economy.ritualCharge=0;if(c.selfOrder!==undefined)delete c.selfOrder;delete c.economy.selfCount;if(Array.isArray(c.economy.tools))c.economy.tools=migrateToolIds(c.economy.tools);if(typeof c.economy.equipped==='string')c.economy.equipped=[c.economy.equipped];c.economy.equipped=migrateToolIds(c.economy.equipped);if(Array.isArray(c.economy.pills))for(const pill of c.economy.pills){if(!pill||typeof pill!=='object')continue;delete pill.self;delete pill.source;delete pill.owner;if(Array.isArray(pill.refinement?.equipped))pill.refinement.equipped=migrateToolIds(pill.refinement.equipped);}c.economy.equipped=equippedIds(c.economy.equipped);Crafts?.ensure?.(c);return c.economy;}
function feel(event,detail={}){if(typeof window!=='undefined')window.AlchemyGameFeel?.emit(event,detail);}
function recordCash(c,kind,before,reference){
  root.AlchemyTelemetry?.cash?.(c,kind,before,reference);
}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='craftMaterial'){const d=Crafts.get(id);if(!d||e.craftStock[id]>=999)return false;price=d.price*(hasTool(e.equipped,'material_scale')?.85:1);}else if(kind==='material'){if(!Number.isInteger(id)||id<0||id>=PRICES.length)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id)||(c.day||1)<TOOL_DEFS.find(t=>t.id===id).day)return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;price=Math.max(1,Math.round(root.AlchemyCounterTrade?.price(c,kind,id,price)??price));if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='craftMaterial')e.craftStock[id]++;else if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;recordCash(c,kind,e.coins+price,id??e.furnace);feel('purchase',{kind,id,price,tier:kind==='furnace'?'medium':'small'});return true;}
function credit(c,n,label,reference){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';recordCash(c,label,e.coins-n,reference);return n;}
function fee(o){return 36+Math.round(o.target*.16);}
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
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;if(hasTool(e.equipped,'material_pouch')&&leftover>0){e.herbs.neutral+=Math.min(1,leftover);o.materialPouchBonus=Math.min(1,leftover);}o.riskPeak=Math.max(Number(o.riskPeak)||0,...pills.map(p=>Number(p?.riskPeak)||0));o.returned=0;o.excess=excessValue(o,pills);const trait=evaluateSpecialTrait(o,pills);if(trait){o.specialMatched=true;o.specialBonus=trait.bonus;o.specialMatchNote=trait.label;const chron=Array.isArray(c?.specialChronicle)&&[...c.specialChronicle].reverse().find(x=>x.arcId===o.arcId&&x.stage===o.arcStage);if(chron){chron.matched=true;chron.bonusLabel=trait.label;}}o.reward=commissionRewardWithTools(c,o,pills)+(o.specialBonus||0);return credit(c,o.reward,'委托工钱与超额补价',o.id);}
function claimPostscript(c,id){const p=Array.isArray(c?.specialPostscripts)&&c.specialPostscripts.find(x=>x.id===id);if(!p||p.claimed)return false;p.claimed=true;if(p.bonusCoins>0)credit(c,p.bonusCoins,p.title||'旧客捎信',p.id);return true;}
function grossValue(pill){
  return Math.round(pill.value + (Number.isFinite(pill.yuanBonus) ? pill.yuanBonus : 0));
}
function saleValue(c,pill){
  const e=ensure(c),rate=e&&hasTool(e.equipped,'market_tag')&&!pill?.craftKind?.08:0;
  const moldBonus=e&&hasTool(e.equipped,'craft_mold')&&pill?.craftKind?.12:0;
  const scarBonus=e&&hasTool(e.equipped,'ember_tray')&&pill?.scars? .08:0;
  return Math.max(0, Math.round(grossValue(pill)*(1+rate+moldBonus+scarBonus) - (pill.materialAdvance || 0)));
}
function storePill(c,p,order){const e=ensure(c),id=p.id;if(typeof id!=='string'||!id||!Array.isArray(e.pills)||e.pills.some(x=>x?.id===id)||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;if(p.craftKind&&!Crafts.get(p.craftKind))return false;e.pills.push({...(p.craftKind?{craftKind:p.craftKind,craftCost:p.craftCost||Crafts.get(p.craftKind).price}:{}),...(typeof p.appearance==='string'?{appearance:p.appearance}:{}),id,...(p.materialAdvance ? {materialAdvance:p.materialAdvance} : {}),day:c.day,value:p.value,yuanBonus:Number.isFinite(p.yuanBonus)?p.yuanBonus:0,turn:p.turn,quality:p.quality,...(Number.isFinite(p.baseValue)?{baseValue:p.baseValue}:{}),...(Number.isFinite(p.riskPeak)?{riskPeak:p.riskPeak}:{}),...(Number.isInteger(p.scars)&&p.scars>0?{scars:p.scars}:{}),nature:p.nature||order?.nature||'neutral'});e.last=p.craftKind?'造物已收纳，可保留、出售或等待求购':'丹药已收入丹匣，可保留、提交或处理';return true;}
function sale(c,id){const e=ensure(c);if(typeof id!=='string'||!Array.isArray(e.pills))return false;const index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index];if(!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;const n=saleValue(c,p);e.pills.splice(index,1);e.sold++;const ok=credit(c,n,p.craftKind?'造物出售':'丹匣成丹出售',id);if(ok)feel('sell',{id,value:n,tier:'medium'});return ok;}
function consignmentTier(p){const turn=Number(p?.turn)||1;return CONSIGNMENT_TIERS[turn>=60?3:turn>=30?2:turn>=15?1:0];}
function consignmentQuote(c,p){const tier=consignmentTier(p),base=saleValue(c,p),e=ensure(c),bonus=hasTool(e.equipped,'consign_plate')?.10:0,gross=base*(1+tier.bonusRate+bonus);return {tier:tier.id,tierName:tier.name,bonusRate:tier.bonusRate+bonus,waitDays:tier.waitDays,basePayout:base,guaranteedPayout:Math.ceil(gross-1e-9),settleDay:(Number(c?.day)||1)+tier.waitDays};}
function consignmentEligibility(c,p){const e=ensure(c),q=consignmentQuote(c,p),listed=e.consignments.filter(x=>x?.status==='listed');if(p?.craftKind)return {ok:false,reason:'寄售柜只收丹药。',quote:q};if(q.basePayout===0)return {ok:false,reason:'抵清料款后无余款可寄售。',quote:q};if((Number(c?.day)||1)<6)return {ok:false,reason:'第6天开放寄售柜。',quote:q};if(listed.length>=3)return {ok:false,reason:'寄售柜已满，最多同时寄售3颗丹药。',quote:q};if(q.settleDay>CONSIGNMENT_MAX_DAY)return {ok:false,reason:'回款日超过本局经营结束，当前不能寄售。',quote:q};return {ok:true,reason:'',quote:q};}
function consign(c,id){const e=ensure(c),index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index],eligibility=consignmentEligibility(c,p);if(!eligibility.ok)return false;const q=eligibility.quote,snapshot={...p},entry={id:'consignment-'+(e.consignmentSeq++),pillSnapshot:snapshot,listedDay:c.day,settleDay:q.settleDay,tier:q.tier,tierName:q.tierName,bonusRate:q.bonusRate,guaranteedPayout:q.guaranteedPayout,status:'listed'};e.pills.splice(index,1);e.consignments.push(entry);e.last='已寄售，'+q.waitDays+'天后回款 '+q.guaranteedPayout+' 铜钱';feel('consign',{id,pill:p,quote:q,tier:'medium'});return entry;}
function settleConsignments(c){const e=ensure(c),paid=[];for(const entry of e.consignments){if(entry?.status!=='listed'||entry.settleDay>(Number(c?.day)||1))continue;entry.status='paid';entry.paidDay=c.day;credit(c,entry.guaranteedPayout,'寄售回款',entry.id);paid.push(entry);}if(paid.length)feel('paid',{count:paid.length,total:paid.reduce((n,x)=>n+x.guaranteedPayout,0),tier:'medium'});return paid;}
function craftSale(c,id){const e=ensure(c),q=Crafts.quote(c,id);if(!q.ok)return false;const index=e.pills.findIndex(p=>p.id===id);if(index<0)return false;e.pills.splice(index,1);e.craftMarket.offer.status='sold';e.sold++;credit(c,q.payout,'造物求购',id);feel('sell',{id,value:q.payout,tier:'medium'});return true;}
function dismissCraftOffer(c){const o=ensure(c).craftMarket.offer;if(!o||o.status!=='waiting')return false;o.status='declined';return true;}
const api={craftSale,dismissCraftOffer,recordCash,grossValue,excessValue,commissionReward,commissionRewardWithTools,evaluateSpecialTrait,claimPostscript,saleValue,storePill,EQUIP_SLOTS,equippedIds,hasTool,TOOL_DEFS,toolRisk,RISK_RULER,riskRulerShift,outcomeWeights,PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale,consignmentTier,consignmentQuote,consignmentEligibility,consign,settleConsignments};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
