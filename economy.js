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
{id:'phoenix',name:'返生鼎符',price:650,day:6,description:'每炉抵挡一次炸炉，维持转数但药力损失40%；此损值系数持续到收丹。'},
{id:'burn',name:'燃纹盏',price:360,day:2,description:'炸炉时自动消耗末道基础纹，改为维持；每炉最多两次。融合纹不消耗。'},
{id:'return',name:'回纹环',price:380,day:3,description:'每炉首次燃纹后，下一次成功自动补回所消耗的纹；满纹则顺延。'},
{id:'ash',name:'烬金印',price:400,day:3,description:'每次燃纹，本炉药力系数永久增加15%，最多两层；换炉清零。'},
{id:'fusion',name:'合璧镜',price:440,day:4,description:'融合后，下一次成功必显基础纹；每炉最多触发两次，不在同次炼化递归。'},
{id:'six',name:'六合盘',price:520,day:5,description:'持有4–5道纹时炸炉率相对降低15%；6道时降低30%。失去纹路即重算。'},
{id:'guide_red',name:'赤砂引',price:260,day:2,runeTarget:'赤纹',description:'生纹时若尚无赤纹，有75%概率定向生成；已持有则生成其他缺纹。灵性药包随机显纹同样受此倾向影响：赤纹。同炉限一件定向法器。'},
{id:'guide_blue',name:'青苔引',price:260,day:2,runeTarget:'青纹',description:'生纹时若尚无青纹，有75%概率定向生成；已持有则生成其他缺纹。灵性药包随机显纹同样受此倾向影响：青纹。同炉限一件定向法器。'},
{id:'guide_moon',name:'月华引',price:260,day:2,runeTarget:'月纹',description:'生纹时若尚无月纹，有75%概率定向生成；已持有则生成其他缺纹。灵性药包随机显纹同样受此倾向影响：月纹。同炉限一件定向法器。'},
{id:'guide_thunder',name:'雷砂引',price:260,day:2,runeTarget:'雷纹',description:'生纹时若尚无雷纹，有75%概率定向生成；已持有则生成其他缺纹。灵性药包随机显纹同样受此倾向影响：雷纹。同炉限一件定向法器。'}];
const PRICES=[18,42,56],TOOLS=Object.fromEntries(TOOL_DEFS.map(t=>[t.id,t.price])),UPGRADES=[0,360,900];
const CONSIGNMENT_MAX_DAY=30;
const CONSIGNMENT_TIERS=[{id:'cabinet',name:'普通药柜',bonusRate:.10,waitDays:2,minDay:6},{id:'premium',name:'精品药柜',bonusRate:.18,waitDays:3,minDay:6},{id:'rare',name:'稀珍药柜',bonusRate:.28,waitDays:4,minDay:6},{id:'fusion',name:'融合专柜',bonusRate:.40,waitDays:5,minDay:6},{id:'town',name:'镇坊展柜',bonusRate:.50,waitDays:7,minDay:6}];
const EQUIP_SLOTS=3;
function equippedIds(value){let directed=false;return [...new Set(Array.isArray(value)?value:value?[value]:[])].filter(id=>{const tool=TOOL_DEFS.find(t=>t.id===id);if(!tool)return false;if(tool.runeTarget){if(directed)return false;directed=true;}return true;}).slice(0,EQUIP_SLOTS);}
function runeTarget(value){return TOOL_DEFS.find(t=>t.runeTarget&&equippedIds(value).includes(t.id))?.runeTarget||null;}
function pickRune(available,value,random=Math.random){if(!available.length)return null;const target=runeTarget(value);if(target&&available.includes(target)){const others=available.filter(r=>r!==target);if(!others.length||random()<.75)return target;return others[Math.floor(random()*others.length)];}return available[Math.floor(random()*available.length)];}
function runeCandidates(available,value,random=Math.random){const target=runeTarget(value),pool=available.filter(r=>r!==target);for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return target&&available.includes(target)?[target,...pool].slice(0,2):pool.slice(0,2);}
function hasTool(value,id){return equippedIds(value).includes(id);}
function toolRisk(value,pill){let factor=1;if(hasTool(value,'ward'))factor*=.9;if(hasTool(value,'repair'))factor*=Math.max(.4,1-.15*Math.min(4,pill?.scars||0));if(hasTool(value,'six'))factor*=pill?.runes?.length>=6?.7:pill?.runes?.length>=4?.85:1;return factor;}
function outcomeWeights(value){return {big:hasTool(value,'lucky')?4:2,success:hasTool(value,'stone')?14:12,hold:hasTool(value,'stone')?3:5,damage:2};}
function ensure(c){if(!c.economy)c.economy={coins:80,earned:0,spent:0,stock:[0,0,0],tools:[],equipped:null,furnace:0,sold:0,last:'开坊本金 80 铜钱'};if(!c.economy.herbs)c.economy.herbs={warm:0,cool:0,neutral:0};if(c.economy.pills===undefined)c.economy.pills=[];if(!Array.isArray(c.economy.consignments))c.economy.consignments=[];if(!Number.isInteger(c.economy.consignmentSeq))c.economy.consignmentSeq=1;if(c.selfOrder!==undefined)delete c.selfOrder;delete c.economy.selfCount;if(Array.isArray(c.economy.pills))for(const pill of c.economy.pills){if(!pill||typeof pill!=='object')continue;delete pill.self;delete pill.source;delete pill.owner;}c.economy.equipped=equippedIds(c.economy.equipped);return c.economy;}
function buy(c,kind,id){const e=ensure(c);let price;if(kind==='material'){if(!Number.isInteger(id)||id<0||id>2)return false;price=PRICES[id];}else if(kind==='tool'){if(!TOOLS[id]||e.tools.includes(id)||(c.day||1)<TOOL_DEFS.find(t=>t.id===id).day)return false;price=TOOLS[id];}else if(kind==='furnace'){if(e.furnace>=2)return false;price=UPGRADES[e.furnace+1];}else return false;if(e.coins<price)return false;e.coins-=price;e.spent+=price;if(kind==='material')e.stock[id]++;else if(kind==='tool')e.tools.push(id);else e.furnace++;return true;}
function credit(c,n,label){const e=ensure(c);n=Math.max(0,Math.round(n));e.coins+=n;e.earned+=n;e.last=label+' +'+n+' 铜钱';return n;}
function fee(o){return 30+Math.round(o.target*.15);}
function excessValue(o,pills){return Math.max(0,Math.round(pills.reduce((n,p)=>n+saleValue(null,p),0)-o.target));}
function commissionReward(o,pills){return fee(o)+excessValue(o,pills);}
function commission(c,o,pills){if(o.paid)return 0;o.paid=true;if(o.status!=='completed')return 0;const e=ensure(c);const leftover=Math.max(0,o.returned||0);const nature=['warm','cool'].includes(o.nature)?o.nature:'neutral';e.herbs[nature]+=leftover;o.gifted=leftover;o.returned=0;o.excess=excessValue(o,pills);o.reward=commissionReward(o,pills);return credit(c,o.reward,'委托工钱与超额补价');}
function saleValue(c,p){return Math.round(p.value+(Number.isFinite(p.yuanBonus)?p.yuanBonus:0));}
function storePill(c,p,order){const e=ensure(c),id=p.id;if(typeof id!=='string'||!id||!Array.isArray(e.pills)||e.pills.some(x=>x?.id===id)||!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100||!Array.isArray(p.runes))return false;e.pills.push({...(typeof p.appearance==='string'?{appearance:p.appearance}:{}),id,day:c.day,value:p.value,yuanBonus:Number.isFinite(p.yuanBonus)?p.yuanBonus:0,turn:p.turn,quality:p.quality,runes:[...p.runes],...(p.runeLevels?{runeLevels:{...p.runeLevels}}:{}),...(Number.isFinite(p.baseValue)?{baseValue:p.baseValue}:{}),nature:p.nature||order?.nature||'neutral'});e.last='丹药已收入丹匣，可保留、提交或处理';return true;}
function sale(c,id){const e=ensure(c);if(typeof id!=='string'||!Array.isArray(e.pills))return false;const index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index];if(!Number.isFinite(p.value)||p.value<=0||!Number.isInteger(p.turn)||p.turn<1||p.turn>100)return false;const n=saleValue(c,p);e.pills.splice(index,1);e.sold++;return credit(c,n,'丹匣成丹出售');}
function consignmentTier(p){const turn=Number(p?.turn)||0,runes=Array.isArray(p?.runes)?p.runes:[],count=runes.length,fused=p?.fused===true||runes.some(r=>r==='金纹'||r==='星痕');if(turn>=60||count>=6||turn>=100)return CONSIGNMENT_TIERS[4];if(fused)return CONSIGNMENT_TIERS[3];if(turn>=30||count>=3)return CONSIGNMENT_TIERS[2];if(turn>=15||count>=2)return CONSIGNMENT_TIERS[1];return CONSIGNMENT_TIERS[0];}
function consignmentQuote(c,p){const tier=consignmentTier(p),base=saleValue(c,p),gross=base*(1+tier.bonusRate);return {tier:tier.id,tierName:tier.name,bonusRate:tier.bonusRate,waitDays:tier.waitDays,basePayout:base,guaranteedPayout:Math.ceil(gross-1e-9),settleDay:(Number(c?.day)||1)+tier.waitDays};}
function consignmentEligibility(c,p){const e=ensure(c),q=consignmentQuote(c,p),listed=e.consignments.filter(x=>x?.status==='listed');if((Number(c?.day)||1)<6)return {ok:false,reason:'第6天开放寄售柜。',quote:q};if(listed.length>=3)return {ok:false,reason:'寄售柜已满，最多同时寄售3颗丹药。',quote:q};if(q.settleDay>CONSIGNMENT_MAX_DAY)return {ok:false,reason:'回款日超过本局经营结束，当前不能寄售。',quote:q};return {ok:true,reason:'',quote:q};}
function consign(c,id){const e=ensure(c),index=e.pills.findIndex(p=>p?.id===id);if(index<0)return false;const p=e.pills[index],eligibility=consignmentEligibility(c,p);if(!eligibility.ok)return false;const q=eligibility.quote,snapshot={...p,runes:[...(p.runes||[])],...(p.runeLevels?{runeLevels:{...p.runeLevels}}:{})},entry={id:'consignment-'+(e.consignmentSeq++),pillSnapshot:snapshot,listedDay:c.day,settleDay:q.settleDay,tier:q.tier,tierName:q.tierName,bonusRate:q.bonusRate,guaranteedPayout:q.guaranteedPayout,status:'listed'};e.pills.splice(index,1);e.consignments.push(entry);e.last='已寄售，'+q.waitDays+'天后回款 '+q.guaranteedPayout+' 铜钱';return entry;}
function settleConsignments(c){const e=ensure(c),paid=[];for(const entry of e.consignments){if(entry?.status!=='listed'||entry.settleDay>(Number(c?.day)||1))continue;entry.status='paid';entry.paidDay=c.day;credit(c,entry.guaranteedPayout,'寄售回款');paid.push(entry);}return paid;}
const api={excessValue,commissionReward,saleValue,storePill,runeTarget,pickRune,runeCandidates,EQUIP_SLOTS,equippedIds,hasTool,TOOL_DEFS,toolRisk,outcomeWeights,PRICES,TOOLS,UPGRADES,ensure,buy,credit,fee,commission,sale,consignmentTier,consignmentQuote,consignmentEligibility,consign,settleConsignments};if(typeof module!=='undefined')module.exports=api;else root.AlchemyEconomy=api;
})(typeof window!=='undefined'?window:globalThis);
