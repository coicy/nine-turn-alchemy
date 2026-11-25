const assert=require('node:assert/strict');
const C=require('./campaign.js');
const full=C.create();
assert.equal(full.reputation,10);assert.equal(full.reputationScale,10);
for(const [rep,min,max] of [[10,7,8],[7,7,8],[6,5,6],[4,5,6],[3,3,4],[1,3,4],[0,0,0]]){
 assert.equal(C.ordersFor(1,()=>0,rep).length,min);assert.equal(C.ordersFor(1,()=>.99,rep).length,max);
}
const c=C.create();
function resolve(c,complete,abandon=false){const o=c.orders.find(o=>o.status==='pending');assert(C.accept(c,o.id));assert(C.resolve(c,complete?500:0,complete?1:3,abandon));return o;}
assert.equal(resolve(c,false).reputationDelta,-1);assert.equal(c.reputation,9);
assert.equal(resolve(c,true).reputationDelta,1);assert.equal(c.reputation,10,'reward caps at 10');
assert.equal(resolve(c,true).reputationDelta,0);assert.equal(c.reputation,10);
resolve(c,false,true);resolve(c,false);assert.equal(c.reputation,8);
assert.equal(resolve(c,true).reputationDelta,2);assert.equal(c.reputation,10);
assert.equal(C.resolve(c,500,1),false,'resolved order cannot pay twice');
assert(C.settle(c));assert.equal(c.history[0].reputation,10);assert.equal(c.history[0].reputationScale,10);
assert.equal(c.history[0].reputationDelta,0,'history reports effective change, including cap');
const skipped=C.create();assert(C.settle(skipped));assert.equal(skipped.reputation,10,'unaccepted orders do not penalize');
for(const [old,expected] of [[100,10],[69,7],[39,4],[10,1],[1,1],[0,0]]){
 const legacy={reputation:old,history:[{reputation:old}]};C.ensure(legacy);assert.equal(legacy.reputation,expected);assert.equal(legacy.history[0].reputation,old);assert.equal(legacy.history[0].reputationScale,100);C.ensure(legacy);assert.equal(legacy.reputation,expected,'conversion runs once');
}
const legacyDay={day:2,phase:'open',reputation:50,orders:[{id:'old',status:'completed',reputationDelta:1}],history:[]};C.ensure(legacyDay);assert.equal(legacyDay.orders[0].reputationDelta,1,'old order reward is never re-issued');assert(C.settle(legacyDay));assert.equal(legacyDay.history[0].reputationDelta,.1,'mixed-scale daily ledger uses the new scale');
const missing={};C.ensure(missing);assert.equal(missing.reputation,10);
const failing=C.create();let failures=0;const events=[],previousDispatch=globalThis.dispatchEvent;globalThis.dispatchEvent=e=>events.push(e);
while(failing.phase!=='finished'){
 for(const o of failing.orders.filter(o=>o.status==='pending')){if(failing.phase==='finished')break;assert(C.accept(failing,o.id));assert(C.resolve(failing,0,3));failures++;}
 if(failing.phase!=='finished'){assert(C.settle(failing));if(failing.phase==='settled')assert(C.next(failing));}
}
globalThis.dispatchEvent=previousDispatch;
assert.equal(failing.endReason,'reputation');assert.equal(failing.orders.length,0);assert.equal(failing.reputation,0);assert.equal(failures,10);
assert.equal(events.length,1);assert.equal(events[0].type,'alchemy:game-over');assert.equal(events[0].detail.reason,'reputation');
const terminal=C.create();terminal.reputation=1;const failedDay=terminal.day;resolve(terminal,false);assert.equal(terminal.reputation,0);assert.equal(terminal.phase,'finished');assert.equal(terminal.day,failedDay,'failure does not advance a day');assert.equal(terminal.history.length,1);
assert.equal(C.accept(terminal,'D1-2'),false);assert.equal(C.resolve(terminal,1000,1),false,'zero cannot be rescued');assert.equal(C.settle(terminal),false);assert.equal(C.next(terminal),false);assert.equal(C.failIfExhausted(terminal),false);assert.equal(terminal.history.length,1,'failure history cannot duplicate');
const resumed=JSON.parse(JSON.stringify(terminal));C.ensure(resumed);assert.equal(resumed.phase,'finished');assert.equal(resumed.reputation,0);
// A successful business can reach the intended 30-day ending.
const career=C.create();for(let day=1;day<=30;day++){for(const o of career.orders){assert(C.accept(career,o.id));assert(C.resolve(career,1000,1));}assert(C.settle(career));if(day<30)assert(C.next(career));}
assert.equal(career.phase,'finished');assert.equal(career.endReason,'contract');assert.equal(career.day,30);
console.log('PASS reputation: 10-point cap, +2/-1, tiers, no double settlement, skip policy, legacy conversion, immediate failure event, terminal save and 30-day ending');
