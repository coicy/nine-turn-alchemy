(function(root){
'use strict';
const DAYS=30;
function ordersFor(day,random=Math.random){
 if(!Number.isInteger(day)||day<1||day>DAYS)throw new Error('Invalid day');
 const step=Math.floor((day-1)/5)*20;
 const pool=[
  {client:'采药散修',name:'行路备丹',target:120},
  {client:'坊市行商',name:'补充行囊',target:200},
  {client:'远行修士',name:'出行代炼',target:300},
  {client:'守夜修士',name:'夜巡备用',target:160},
  {client:'山间药农',name:'入山备药',target:140},
  {client:'渡口船客',name:'渡江行囊',target:180},
  {client:'游学弟子',name:'游历备丹',target:240},
  {client:'驿路信使',name:'赶路急需',target:220},
  {client:'闭关散修',name:'静修储备',target:280},
  {client:'探洞修士',name:'秘境备丹',target:260}
 ];
 const count=random()<0.5?7:8;
 for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}
 return pool.slice(0,count).map((o,i)=>({...o,target:o.target+step,id:`D${day}-${i+1}`,materials:3,status:'pending',delivered:0,used:0,returned:0}));
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
