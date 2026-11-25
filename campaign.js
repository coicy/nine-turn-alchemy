(function(root){
'use strict';
 const DAYS=30,MAX_REPUTATION=10,economy=root.AlchemyEconomy||(typeof require==='function'?require('./economy.js'):null);
 const catalog=root.AlchemyCustomerCatalog||(typeof require==='function'?require('./customer-catalog.js'):null);
 function clampReputation(value){return Math.max(0,Math.min(MAX_REPUTATION,Math.round(Number(value)||0)));}
 function customerCount(reputation,random){
  const rep=clampReputation(reputation);
  if(rep<=0)return 0;
  if(rep<4)return random()<0.5?3:4;
  if(rep<7)return random()<0.5?5:6;
  return random()<0.5?7:8;
 }
 function ordersFor(day,random=Math.random,reputation=MAX_REPUTATION){
 if(!Number.isInteger(day)||day<1||day>DAYS)throw new Error('Invalid day');
 const step=Math.floor((day-1)/5)*24;
 const pool=[
  {client:'采药散修',name:'行路备丹',target:84},
  {client:'坊市行商',name:'补充行囊',target:120},
  {client:'远行修士',name:'出行代炼',target:180},
  {client:'守夜修士',name:'夜巡备用',target:108},
  {client:'山间药农',name:'入山备药',target:96},
  {client:'渡口船客',name:'渡江行囊',target:114},
  {client:'游学弟子',name:'游历备丹',target:156},
  {client:'驿路信使',name:'赶路急需',target:132},
  {client:'闭关散修',name:'静修储备',target:168},
  {client:'探洞修士',name:'秘境备丹',target:144}
 ];
 const natures={'行路备丹':'neutral','补充行囊':'neutral','出行代炼':'warm','夜巡备用':'warm','入山备药':'neutral','渡江行囊':'cool','游历备丹':'neutral','赶路急需':'warm','静修储备':'cool','秘境备丹':'cool'};
 for(const o of pool)o.nature=natures[o.name];
 const count=customerCount(reputation,random);
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[i],pool[j]];}
 return pool.slice(0,count).map((o,i)=>({...o,target:o.target+step,id:`D${day}-${i+1}`,materials:3,status:'pending',delivered:0,used:0,returned:0}));
}
 function ensure(c){
  if(!c||typeof c!=='object')return c;
  // Unmarked saves used the old 100-point scale. Convert once, preserving positive progress.
  if(c.reputationScale!==MAX_REPUTATION){
    if(Number.isFinite(c.reputation))c.reputation=c.reputation>0?Math.ceil(c.reputation/10):0;
    for(const day of Array.isArray(c.history)?c.history:[])if(day.reputationScale==null)day.reputationScale=100;
    for(const order of Array.isArray(c.orders)?c.orders:[])if(Number.isFinite(order.reputationDelta)&&order.reputationScale==null)order.reputationScale=100;
    c.reputationScale=MAX_REPUTATION;
  }
  c.reputation=Number.isFinite(c.reputation)?clampReputation(c.reputation):MAX_REPUTATION;
  if(typeof c.endReason!=='string')c.endReason='';
  if(!Array.isArray(c.history))c.history=[];
  if(!Array.isArray(c.orders))c.orders=[];
  if(!c.specialArcs||typeof c.specialArcs!=='object')c.specialArcs={};
  if(!Array.isArray(c.specialChronicle))c.specialChronicle=[];
  if(!Array.isArray(c.specialPostscripts))c.specialPostscripts=[];
  if(!Array.isArray(c.usedRandomNotes))c.usedRandomNotes=[];
  return c;
 }
 function recordSpecialOutcome(c,o){
  if(!c||!o)return;
  ensure(c);
  if(o.arcId&&catalog?.specialArcs?.[o.arcId]){
   const arc=catalog.specialArcs[o.arcId],stageDef=arc.stages?.[o.arcStage];
   const state=c.specialArcs[o.arcId]||{stage:1,lastOutcome:null,lastDay:0,history:[]};
   if(!Array.isArray(state.history))state.history=[];
   if(state.history.some(h=>h.day===c.day&&h.stage===o.arcStage))return;
   const done=o.status==='completed';
   state.history.push({day:c.day,stage:o.arcStage,status:o.status,matched:!!o.specialMatched});
   state.lastOutcome=done?'completed':'failed';
   state.lastDay=c.day;
   state.stage=o.arcStage+1;
   c.specialArcs[o.arcId]=state;
   const entryText=done?stageDef?.journalDone:stageDef?.journalMiss;
   if(entryText){
    c.specialChronicle.push({day:c.day,arcId:o.arcId,name:arc.name,role:arc.role,title:arc.title,stage:o.arcStage,status:o.status,matched:!!o.specialMatched,text:entryText});
   }
  }else if(o.specialNoteId&&catalog?.randomNotes){
   const rNote=catalog.randomNotes.find(n=>n.id===o.specialNoteId);
   if(rNote&&o.status==='completed'&&!c.specialChronicle.some(x=>x.noteId===rNote.id)){
    c.specialChronicle.push({day:c.day,noteId:rNote.id,name:rNote.author,role:'坊间来笺',title:rNote.title,stage:1,status:'completed',text:rNote.completed});
   }
  }
 }
 function scheduleSpecialForDay(c){
  ensure(c);
  if(!catalog?.specialArcs||c.day<4||!Array.isArray(c.orders)||!c.orders.length)return c;
  const arcOrder=['special-hua','special-bai','special-qin','special-jiao','special-cui','imperial-gao'];
  // 1. Deliver Act 4 postscripts (non-order letters) on Days 28-30
  for(const arcId of arcOrder){
   const arc=catalog.specialArcs[arcId],state=c.specialArcs[arcId]||{stage:1,lastOutcome:null,lastDay:0,history:[]};
   const stage4=arc?.stages?.[4];
   if(stage4?.postscript&&!state.postscriptDelivered&&c.day>=stage4.dayMin&&(state.stage>=4||(c.day>=29&&state.stage>=2))){
    state.postscriptDelivered=true;
    state.stage=5;
    c.specialArcs[arcId]=state;
    c.specialPostscripts.push({id:`${arcId}-postscript-D${c.day}`,arcId,name:arc.name,role:arc.role,day:c.day,title:stage4.title,sender:stage4.sender,body:stage4.body,bonusCoins:stage4.bonusCoins||0,claimed:false});
    if(stage4.journalDone&&!c.specialChronicle.some(x=>x.arcId===arcId&&x.stage===4)){
     c.specialChronicle.push({day:c.day,arcId,name:arc.name,role:arc.role,title:arc.title,stage:4,status:'postscript',text:stage4.journalDone});
    }
   }
  }
  // 2. Schedule at most 1 special multi-visit order today
  if(!c.orders.some(o=>o.arcId)){
   let chosenArc=null,chosenStage=null,chosenDef=null;
   for(const arcId of arcOrder){
    if(arcId==='imperial-gao'&&c.reputation<6)continue;
    const arc=catalog.specialArcs[arcId],state=c.specialArcs[arcId]||{stage:1,lastOutcome:null,lastDay:0,history:[]};
    const stageNum=state.stage||1,stageDef=arc?.stages?.[stageNum];
    if(!stageDef||stageDef.postscript)continue;
    if(state.lastDay&&c.day-state.lastDay<2)continue;
    if(c.day>=stageDef.dayMin&&c.day<=stageDef.dayMax+2){
     chosenArc=arc;chosenStage=stageNum;chosenDef=stageDef;break;
    }
   }
   if(chosenArc&&chosenDef){
    const targetOrder=c.orders[0];
    const state=c.specialArcs[chosenArc.id]||{stage:1,lastOutcome:null,lastDay:0,history:[]};
    targetOrder.customerId=chosenArc.id;
    targetOrder.arcId=chosenArc.id;
    targetOrder.arcStage=chosenStage;
    targetOrder.arcPrevOutcome=state.lastOutcome||null;
    targetOrder.client=chosenArc.role;
    targetOrder.name=chosenDef.orderName||targetOrder.name;
    if(chosenDef.preferredNature)targetOrder.nature=chosenDef.preferredNature;
   }
  }
  // 3. Attach at most 1 zero-cost random background paper note on secondary normal order
  if(catalog.randomNotes?.length&&c.orders.length>1&&!c.orders.some(o=>o.specialNoteId)){
   const nextNote=catalog.randomNotes.find(n=>!c.usedRandomNotes.includes(n.id));
   if(nextNote&&[4,8,13,18].includes(c.day)){
    const normalOrder=c.orders.find(o=>!o.arcId);
    if(normalOrder){
     normalOrder.specialNoteId=nextNote.id;
     normalOrder.name=nextNote.title;
     c.usedRandomNotes.push(nextNote.id);
    }
   }
  }
  return c;
 }
 function create(){return{day:1,phase:'open',activeId:null,reputation:MAX_REPUTATION,reputationScale:MAX_REPUTATION,endReason:'',orders:ordersFor(1,Math.random,MAX_REPUTATION),history:[],specialArcs:{},specialChronicle:[],specialPostscripts:[],usedRandomNotes:[]};}
 function active(c){ensure(c);return c?.orders.find(o=>o.id===c.activeId&&o.status==='active')||null;}
 function accept(c,id){ensure(c);if(c.reputation<=0){failIfExhausted(c);return false;}if(c.phase!=='open'||active(c))return false;const o=c.orders.find(o=>o.id===id&&o.status==='pending');if(!o)return false;o.status='active';c.activeId=id;return true;}
 function resolve(c,delivered,used,abandon=false){ensure(c);const o=active(c);if(!o||o.status!=='active')return false;const completed=!abandon&&delivered>=o.target;o.delivered=delivered;o.used=used;o.returned=o.materials-used;o.status=completed?'completed':'failed';const before=c.reputation;c.reputation=clampReputation(before+(completed?2:-1));o.reputationDelta=c.reputation-before;o.reputationScale=MAX_REPUTATION;c.activeId=null;recordSpecialOutcome(c,o);failIfExhausted(c);return true;}
 function settle(c){ensure(c);if(c.phase!=='open'||active(c)||false)return false;c.orders.filter(o=>o.status==='pending').forEach(o=>{o.status='skipped';recordSpecialOutcome(c,o);});c.history.push({skipped:c.orders.filter(o=>o.status==='skipped').length,commissionIncome:c.orders.reduce((n,o)=>n+(o.reward||0),0),gifted:c.orders.reduce((n,o)=>n+(o.gifted||0),0),income:c.economy?.earned||0,day:c.day,completed:c.orders.filter(o=>o.status==='completed').length,failed:c.orders.filter(o=>o.status==='failed').length,delivered:c.orders.reduce((n,o)=>n+o.delivered,0),reputation:c.reputation,reputationScale:MAX_REPUTATION,reputationDelta:c.orders.reduce((n,o)=>n+(o.reputationDelta||0)/(o.reputationScale===100?10:1),0)});c.phase=c.day===DAYS?'finished':'settled';if(c.day===DAYS)c.endReason=c.reputation<=0?'reputation':'contract';economy?.settleConsignments?.(c);return true;}
 function next(c){ensure(c);if(c.reputation<=0){failIfExhausted(c);return false;}if(c.phase!=='settled'||c.day>=DAYS)return false;c.day++;c.orders=ordersFor(c.day,Math.random,c.reputation);const penalty=Math.max(0,Math.min(.25,Number(c.economy?.nextOrderTargetPenalty)||0));if(penalty){for(const o of c.orders)o.target=Math.max(24,Math.round(o.target*(1-penalty)));if(c.economy)c.economy.nextOrderTargetPenalty=0;}scheduleSpecialForDay(c);c.phase='open';c.activeId=null;economy?.settleConsignments?.(c);return true;}
 function failIfExhausted(c){
  if(!c||c.reputation>0||c.phase==='finished')return false;
  if(c.phase==='open'){c.activeId=null;settle(c);}
  c.phase='finished';c.endReason='reputation';c.activeId=null;c.orders=[];
  if(typeof root.dispatchEvent==='function'&&typeof CustomEvent==='function')root.dispatchEvent(new CustomEvent('alchemy:game-over',{detail:{reason:'reputation',day:c.day,reputation:0}}));
  return true;
 }
 const api={failIfExhausted,DAYS,MAX_REPUTATION,ordersFor,scheduleSpecialForDay,recordSpecialOutcome,create,ensure,active,accept,resolve,settle,next};
if(typeof module!=='undefined')module.exports=api;else root.AlchemyCampaign=api;
})(typeof window!=='undefined'?window:globalThis);
