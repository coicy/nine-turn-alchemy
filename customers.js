(function(root){
 'use strict';
 const C=root.AlchemyCustomerCatalog||(typeof require==='function'?require('./customer-catalog.js'):null);
 const STATES={pending:'request',active:'waiting',completed:'thanks',failed:'regret',skipped:'away'};
 function profile(order){return C.profiles.find(p=>p.id===order?.customerId)||C.profiles.find(p=>p.role===order?.client)||{id:'unknown',name:order?.client||'来客',role:order?.client||'来客',appearanceId:null,request:'想请掌柜代炼这一单。'};}
 function appearance(p,state){const a=C.assets.find(a=>a.id===p.appearanceId);if(!a)return null;const actual=a.states[state]?state:'neutral';return {id:a.id,canvas:a.canvas,anchor:a.anchor,requestedState:state,actualState:actual,frame:a.states[actual]};}
 function visit(order){const p=profile(order),state=STATES[order?.status]||'request';return {id:order?.id||'unknown-visit',customerId:p.id,name:p.name,role:p.role,status:order?.status,state,away:['completed','failed','skipped'].includes(order?.status),appearance:appearance(p,state)};}
 function arcStageData(order){return (order?.arcId&&C.specialArcs?.[order.arcId]?.stages?.[order.arcStage])||null;}
 function randomNoteData(order){return (order?.specialNoteId&&C.randomNotes?.find(n=>n.id===order.specialNoteId))||null;}
 function letterBody(order){
  const stage=arcStageData(order);
  if(stage){
   const prev=order.arcPrevOutcome==='completed'?stage.prevCompleted:order.arcPrevOutcome?stage.prevFailed:'';
   return [stage.action,prev,stage.letter].filter(Boolean).join('\n');
  }
  const rNote=randomNoteData(order);
  if(rNote)return rNote.letter;
  return null;
 }
 function traitHint(order){
  const rule=arcStageData(order)?.traitRule;
  const map={unscarred:'偏好：无受损裂纹之丹',scarred:'偏好：曾受损带裂纹，或炉险曾达35%以上之丹',highRisk:'偏好：炉险曾达35%、温性或达7转以上之丹',excess:'偏好：药力超额≥24，或达8转以上之丹',coolNature:'偏好：寒性之丹，或超额不超过36之丹',highTurn:'偏好：达5转及以上之丹'};
  return rule?map[rule]||'':'';
 }
 function line(order){
  const p=profile(order),stage=arcStageData(order),rNote=randomNoteData(order);
  if(stage){
   switch(order?.status){
    case 'pending':{
     const prev=order.arcPrevOutcome==='completed'?stage.prevCompleted:order.arcPrevOutcome?stage.prevFailed:'';
     return (prev?prev+' ':'')+stage.pending+`（托料${order.materials}包，所求药力${order.target}）`;
    }
    case 'active':return stage.active||'我在柜边候着，掌柜照常守炉便好。';
    case 'completed':return (order.specialMatched&&stage.traitReaction?stage.traitReaction+' ':'')+stage.completed;
    case 'failed':return stage.failed||'这回没能凑齐，也不必赔药。改日再来。';
    default:return stage.failed||'今日未能托付，改日再来。';
   }
  }
  if(rNote){
   if(order?.status==='pending')return rNote.letter+`（所求药力${order.target}）`;
   if(order?.status==='completed'&&rNote.completed)return rNote.completed;
  }
  switch(order?.status){
   case 'pending':return p.request+`这${order.materials}包药材，炼到药力${order.target}便好。`;
   case 'active':return '我在柜边候着，掌柜照常守炉便好。';
   case 'completed':return order.gifted>0?'丹药收到了，多谢掌柜。未用的药材便留给你吧。':'丹药收到了，多谢掌柜，这一单辛苦了。';
   case 'failed':return '这回没能凑齐，也不必赔药。改日再来。';
   default:return '今日未能托付，改日再来。';
  }
 }
 function waiting(orders,selectedId,limit=2){const selected=orders.find(o=>o.id===selectedId),used=new Set();if(selected&&!visit(selected).away)used.add(profile(selected).appearanceId);const result=[];for(const o of orders){const id=profile(o).appearanceId;if(o.id===selectedId||o.status!=='pending'||!id||used.has(id))continue;used.add(id);result.push(o);if(result.length>=limit)break;}return result;}
 function bind(campaign){for(const o of campaign?.orders||[]){const p=profile(o);if(p.id!=='unknown')o.customerId=p.id;}return campaign;}
 function settlement(order){
  const done=order.status==='completed',fee=root.AlchemyEconomy.fee(order),traitBonus=Number(order.specialBonus)||0,extra=Math.max(0,(order.reward||0)-fee-traitBonus);
  const bonusStr=traitBonus>0&&order.specialMatchNote?` + ${order.specialMatchNote}`:'';
  return [
   done?'本单完成 · '+profile(order).name:order.status==='failed'?'本单未完成 · 失败免赔':'本单已终止 · 失败免赔',
   done?`工钱 ${fee} + ${order.excess===undefined?'额外报酬':'超额补价'} ${extra} 铜钱${bonusStr} · 赠留余药 ${order.gifted||0} 包${order.materialPouchBonus?' + 余料囊 '+order.materialPouchBonus+' 包':''}`:`退回余药 ${order.returned||0} 包 · 丹匣丹药保留`,
   '客户留言：'+line(order)
  ].join('\n');
 }
 function sources(){return [...new Set(C.assets.flatMap(a=>Object.values(a.states).map(f=>f.src)))];}
 function validate(){const errors=[],ids=new Set();for(const a of C.assets){if(ids.has(a.id))errors.push('重复素材 '+a.id);ids.add(a.id);if(a.anchor!=='bottom-center'||a.canvas?.width!==400||a.canvas?.height!==675)errors.push('素材画布或锚点不合规范 '+a.id);if(!a.states?.neutral)errors.push('缺默认图 '+a.id);for(const f of Object.values(a.states||{})){if(!/^assets\/[\w./-]+\.(png|webp)$/.test(f.src)||f.src.includes('..')||![f.columns,f.rows].every(n=>Number.isInteger(n)&&n>0)||![f.column,f.row].every(Number.isInteger)||f.column<0||f.column>=f.columns||f.row<0||f.row>=f.rows)errors.push('无效图帧 '+a.id);}}
  const people=new Set();for(const p of C.profiles){if(people.has(p.id)||!ids.has(p.appearanceId)||!p.name||!p.role)errors.push('无效客人 '+p.id);people.add(p.id);}return errors;
 }
 function note(order){const p=profile(order),id=p.noteStyle||C.noteRoles?.[p.role]||'recluse';return C.notes?.[id]||{id:'generic',src:'assets/counter-props/merchant.webp'};}
 const api={catalog:C,profile,appearance,visit,arcStageData,randomNoteData,letterBody,traitHint,line,waiting,sources,bind,validate,note,settlement};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlchemyCustomers=api;
})(typeof window!=='undefined'?window:globalThis);
