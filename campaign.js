(function(root){
'use strict';
const DAYS=30;
function ordersFor(day){
 if(!Number.isInteger(day)||day<1||day>DAYS)throw new Error('Invalid day');
 const step=Math.floor((day-1)/5)*20;
 return [
  {client:'采药散修',name:'行路备丹',target:120+step},
  {client:'坊市行商',name:'补充行囊',target:200+step},
  {client:'远行修士',name:'出行代炼',target:300+step}
 ].map((o,i)=>({...o,id:`D${day}-${i+1}`,materials:3,status:'pending',delivered:0,used:0,returned:0}));
}
function create(){return{day:1,phase:'open',activeId:null,orders:ordersFor(1),history:[]};}
function active(c){return c.orders.find(o=>o.id===c.activeId)||null;}
function accept(c,id){if(c.phase!=='open'||active(c))return false;const o=c.orders.find(o=>o.id===id&&o.status==='pending');if(!o)return false;o.status='active';c.activeId=id;return true;}
function resolve(c,delivered,used,abandon=false){const o=active(c);if(!o||o.status!=='active')return false;o.delivered=delivered;o.used=used;o.returned=o.materials-used;o.status=!abandon&&delivered>=o.target?'completed':'failed';c.activeId=null;return true;}
function settle(c){if(c.phase!=='open'||active(c)||c.orders.some(o=>o.status==='pending'))return false;c.history.push({day:c.day,completed:c.orders.filter(o=>o.status==='completed').length,failed:c.orders.filter(o=>o.status==='failed').length,delivered:c.orders.reduce((n,o)=>n+o.delivered,0)});c.phase=c.day===DAYS?'finished':'settled';return true;}
function next(c){if(c.phase!=='settled'||c.day>=DAYS)return false;c.day++;c.orders=ordersFor(c.day);c.phase='open';c.activeId=null;return true;}
const api={DAYS,ordersFor,create,active,accept,resolve,settle,next};
if(typeof module!=='undefined')module.exports=api;else root.AlchemyCampaign=api;
})(typeof window!=='undefined'?window:globalThis);
