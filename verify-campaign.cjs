const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const base=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split("const click=id=>")[0]
 .replace("window.scrollTo=()=>{};","window.scrollTo=()=>{};window.localStorage=auditStorage;")
 .replace('vm.runInContext(source,context);',"vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);");
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
function environment(){const outer={require,__dirname,console,auditStorage:storage};vm.createContext(outer);vm.runInContext(base+`;globalThis.env={window,document,el,flush,context};`,outer);return outer.env;}
let e=environment();const api=()=>e.window.AlchemyGame;
function click(id){e.el(id).click()}function flush(n){e.flush(n)}function state(){return api().snapshot()}
click('startButton');assert.equal(api().campaign().orders.length,8);assert.ok(state().target>=120);assert.equal(state().attempt,0);
assert.equal(api().endDay(),false);assert.equal(api().chooseOrder('D1-2'),false,'cannot mix orders');
click('herbObject');click('fireObject');assert.equal(api().abandonOrder(),false,'pour locks order');flush(720);assert.equal(api().abandonOrder(),false,'live pill must be handled');
e.context.testApi.getState().pill.value=500;e.context.testApi.render();click('pillVisual');click('trayObject');flush(320);
assert.equal(api().campaign().orders[0].status,'completed');assert.equal(api().campaign().orders[0].returned,2);assert.equal(state().delivered,500);assert.equal(api().endDay(),false);
assert.equal(api().chooseOrder('D1-2'),true);assert.ok(state().target>=120);assert.equal(state().delivered,0);assert.equal(state().remaining,3);assert.equal(e.el('trayPills').innerHTML,'','new order clears tray');
assert.equal(api().abandonOrder(),true);assert.equal(api().abandonOrder(),false,'no duplicate settlement');assert.equal(api().campaign().orders[1].returned,3);
assert.equal(api().chooseOrder('D1-3'),true);
for(let i=0;i<3;i++){click('herbObject');click('fireObject');flush(720);click('pillVisual');click('trayObject');flush(320)}
assert.equal(api().campaign().orders[2].status,'failed');assert.equal(api().campaign().orders[2].delivered,72);for(const o of api().campaign().orders.filter(o=>o.status==='pending')){api().chooseOrder(o.id);api().abandonOrder();}assert.equal(api().endDay(),true);assert.equal(api().endDay(),false);assert.equal(api().campaign().day,1,'day does not advance automatically');
assert.equal(api().nextDay(),true);assert.equal(api().nextDay(),false);assert.equal(api().campaign().day,2);assert.equal(state().remaining,0,'no materials before accepting order');
api().chooseOrder('D2-2');click('herbObject');click('fireObject');flush(720);
const saved=JSON.parse(store.get('alchemy-days-v1'));assert.equal(saved.campaign.day,2);assert.equal(saved.state.attempt,1);
e=environment();e.el('startButton').emit('click',{currentTarget:e.el('startButton')});assert.equal(api().campaign().day,2);assert.equal(state().attempt,1);assert.equal(state().orderId,'D2-2');assert.equal(state().delivered,0);assert.equal(state().remaining,2,'resume does not reissue materials');
click('pillVisual');click('trayObject');flush(320);assert.equal(api().abandonOrder(),true);
for(let day=2;day<=30;day++){
 for(const o of api().campaign().orders.filter(o=>o.status==='pending')){assert.equal(api().chooseOrder(o.id),true);assert.equal(api().abandonOrder(),true)}
 assert.equal(api().endDay(),true);assert.equal(api().endDay(),false);
 if(day<30)assert.equal(api().nextDay(),true);
}
const c=api().campaign();assert.equal(c.phase,'finished');assert.equal(c.day,30);assert.equal(c.history.length,30);assert.equal(c.history.reduce((n,d)=>n+d.completed+d.failed,0),240);assert.equal(api().nextDay(),false);assert.equal(api().chooseOrder('D30-1'),false);
console.log('Campaign integration passed: daily random orders, isolated materials/value, success/failure/abandon, interaction locks, explicit settlement, resume, all 30 days and final summary.');

