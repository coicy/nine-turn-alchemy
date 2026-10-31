(function(root){
 'use strict';
 const C=root.AlchemyCustomerCatalog||(typeof require==='function'?require('./customer-catalog.js'):null);
 const STATES={pending:'request',active:'waiting',completed:'thanks',failed:'regret',skipped:'away'};
 function profile(order){return C.profiles.find(p=>p.id===order?.customerId)||C.profiles.find(p=>p.role===order?.client)||{id:'unknown',name:order?.client||'来客',role:order?.client||'来客',appearanceId:null,request:'想请掌柜代炼这一单。'};}
 function appearance(p,state){const a=C.assets.find(a=>a.id===p.appearanceId);if(!a)return null;const actual=a.states[state]?state:'neutral';return {id:a.id,canvas:a.canvas,anchor:a.anchor,requestedState:state,actualState:actual,frame:a.states[actual]};}
 function visit(order){const p=profile(order),state=STATES[order?.status]||'request';return {id:order?.id||'unknown-visit',customerId:p.id,name:p.name,role:p.role,status:order?.status,state,away:['completed','failed','skipped'].includes(order?.status),appearance:appearance(p,state)};}
 function line(order){const p=profile(order);switch(order?.status){
  case 'pending':return p.request+`这${order.materials}包药材，炼到丹值${order.target}便好。`;
  case 'active':return '我在柜边候着，掌柜照常守炉便好。';
  case 'completed':return order.gifted>0?'丹药收到了，多谢掌柜。未用的药材便留给你吧。':'丹药收到了，多谢掌柜，这一单辛苦了。';
  case 'failed':return '这一炉没能如愿，也不必赔药。成丹与余料我领回了，改日再来。';
  default:return '今日未能托付，改日再来。';
 }}
 function waiting(orders,selectedId,limit=2){const selected=orders.find(o=>o.id===selectedId),used=new Set();if(selected&&!visit(selected).away)used.add(profile(selected).appearanceId);const result=[];for(const o of orders){const id=profile(o).appearanceId;if(o.id===selectedId||o.status!=='pending'||!id||used.has(id))continue;used.add(id);result.push(o);if(result.length>=limit)break;}return result;}
 function bind(campaign){for(const o of campaign?.orders||[]){const p=profile(o);if(p.id!=='unknown')o.customerId=p.id;}return campaign;}
 function sources(){return [...new Set(C.assets.flatMap(a=>Object.values(a.states).map(f=>f.src)))];}
 function validate(){const errors=[],ids=new Set();for(const a of C.assets){if(ids.has(a.id))errors.push('重复素材 '+a.id);ids.add(a.id);if(a.anchor!=='bottom-center'||a.canvas?.width!==400||a.canvas?.height!==675)errors.push('素材画布或锚点不合规范 '+a.id);if(!a.states?.neutral)errors.push('缺默认图 '+a.id);for(const f of Object.values(a.states||{})){if(!/^assets\/[\w./-]+\.(png|webp)$/.test(f.src)||f.src.includes('..')||![f.columns,f.rows].every(n=>Number.isInteger(n)&&n>0)||![f.column,f.row].every(Number.isInteger)||f.column<0||f.column>=f.columns||f.row<0||f.row>=f.rows)errors.push('无效图帧 '+a.id);}}
  const people=new Set();for(const p of C.profiles){if(people.has(p.id)||!ids.has(p.appearanceId)||!p.name||!p.role)errors.push('无效客人 '+p.id);people.add(p.id);}return errors;
 }
 const api={catalog:C,profile,appearance,visit,line,waiting,sources,bind,validate};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.AlchemyCustomers=api;
})(typeof window!=='undefined'?window:globalThis);
