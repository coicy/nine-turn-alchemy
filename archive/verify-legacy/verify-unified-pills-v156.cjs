const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');

const dir = __dirname;
const prelude = fs.readFileSync(dir + '/verify-simulation.cjs', 'utf8').split('const click=id=>')[0]
  .replace('window.scrollTo=()=>{};', 'window.scrollTo=()=>{};window.localStorage=auditStorage;')
  .replace('Event:class{constructor(type){this.type=type}}', 'Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}}')
  .replace(
    'vm.runInContext(source,context);',
    "vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);"
  );

const store = new Map();
const storage = { getItem: key => store.get(key) || null, setItem: (key, value) => store.set(key, value) };
function environment() {
  const outer = { require, __dirname: dir, console, auditStorage: storage };
  vm.createContext(outer);
  vm.runInContext(prelude + ';globalThis.env={window,document,el,flush,context};', outer);
  return outer.env;
}

let env = environment();
const api = () => env.window.AlchemyGame;
const click = id => env.el(id).click();
const flush = delay => env.flush(delay);

const legacy = { selfOrder: { id: 'S1' }, economy: { selfCount: 2, herbs: { warm: 0, cool: 0, neutral: 0 }, pills: [{ id: 'P-old', value: 24, self: true, source: 'gift' }] } };
env.window.AlchemyEconomy.ensure(legacy);
assert.equal(legacy.selfOrder, undefined, 'legacy synthetic order is removed on load');
assert.equal(legacy.economy.selfCount, undefined, 'legacy synthetic counter is removed on load');
assert.equal(legacy.economy.pills[0].self, undefined, 'legacy ownership flag is removed on load');
assert.equal(legacy.economy.pills[0].source, undefined, 'legacy ownership source is removed on load');

click('startButton');
assert.equal(api().campaign().selfOrder, undefined, 'campaign no longer creates a self order');
assert.equal(api().abandonOrder(), true, 'finish the automatically opened commission before testing reserve stock');
assert.equal(api().snapshot().order, null, 'no order is active before accepting a commission');

assert.equal(api().economyAction('material', 0), true, 'buy a reserve pack');
assert.equal(api().economyAction('reservePack', 0), true, 'open a furnace from reserve stock');
let state = api().snapshot();
assert.equal(state.order, null, 'reserve furnace has no commission order');
assert.equal(state.orderId, null, 'reserve furnace has no synthetic order id');
assert.equal(env.context.testApi.getState().materialNature, 'neutral');
assert.equal(api().campaign().economy.stock[0], 0);

click('herbObject');
click('fireObject');
flush(720);
assert.equal(api().snapshot().attempt, 1);
assert.equal(api().snapshot().order, null);
assert.equal(api().collect(), true, 'reserve furnace stores its pill');
state = api().snapshot();
const storedId = state.pillId;
assert.equal(state.roundEnded, true);
assert.equal(api().campaign().economy.pills.length, 1);
assert.equal(api().campaign().economy.pills[0].id, storedId);
assert.equal(api().campaign().economy.pills[0].source, undefined, 'stored pills have no ownership source');
assert.equal(api().economyAction('sell', storedId) > 0, true, 'stored pill can be sold from the unified bag');
assert.equal(api().campaign().economy.pills.length, 0);

assert.equal(api().chooseOrder('D1-2'), true, 'commission flow remains available');
state = api().snapshot();
assert.equal(state.order.status, 'active');
assert.equal(state.order.self, undefined, 'commission has no self ownership flag');
assert.equal(api().campaign().selfOrder, undefined);
const commissionNature = state.order.nature;

click('herbObject');
click('fireObject');
flush(720);
env.context.testApi.getState().pill.value = 500;
env.context.testApi.render();
assert.equal(api().collect(), true, 'commission pill also enters the unified bag first');
const commissionPillId = api().snapshot().pillId;
assert.equal(api().submit(commissionPillId), true, 'commission delivery is an explicit bag action');
assert.ok(api().campaign().economy.herbs[commissionNature] > 0, 'unused commission materials become reserve herb');
assert.equal(api().economyAction('reserveHerb', commissionNature, commissionNature), true, 'leftover herb opens a reserve furnace');
state = api().snapshot();
assert.equal(state.order, null);
assert.equal(state.orderId, null);
assert.equal(env.context.testApi.getState().materialNature, commissionNature);
assert.equal(api().campaign().economy.herbs[commissionNature], 1);

console.log('Unified pills V156 passed: reserve materials and commissions share one bag; no self order, ownership source, or synthetic order id is created.');

// Resume a previous-version furnace and a pending contract, then reload the migrated save.
env=environment();
click('startButton');
api().load();
const old=JSON.parse(store.get('alchemy-days-v1'));
const e=old.campaign.economy;
delete e.rulesRevision;
old.campaign.day=6;
e.loopVersion=143;
e.coins=100;
e.spent=1500;
e.tools=['needle','needle','seal','guide_red'];
e.equipped=['guide_red','seal'];
e.stock=[1,1,2];
const vintage={id:'P-old',value:149,turn:5,quality:1,runes:['金纹'],runeLevels:{'金纹':2},nature:'warm'};
e.pills=[vintage];
e.consignments=[{id:'old-order',status:'listed',tier:'fusion',tierName:'融合专柜',settleDay:7,guaranteedPayout:211,pillSnapshot:{...vintage}}];
Object.assign(old.state.pill,vintage,{id:'P-live',baseValue:100,shield:true,moonCharge:1,runeChoices:['赤纹']});
store.set('alchemy-days-v1',JSON.stringify(old));
function resume(){env=environment();const start=env.el('startButton');start.emit('click',{currentTarget:start});}
resume();
let economy=api().campaign().economy;
assert.equal(economy.coins,772);
assert.deepEqual(Array.from(economy.tools),['seal']);
assert.deepEqual(Array.from(economy.equipped),['seal']);
assert.equal(economy.pills[0].value,149);
assert.equal(api().snapshot().value,149);
assert.equal(api().refinementProbabilities().protection.source,'seal');
assert.ok(!('runes' in api().snapshot()));
assert.ok(!('runes' in economy.pills[0]));
assert.equal(economy.consignments[0].guaranteedPayout,211);
assert.equal(economy.consignments[0].settleDay,7);
resume();
assert.equal(api().campaign().economy.coins,772,'refund must only be credited once');
const projected=api().successValuePreview();
assert.ok(projected.value>149);
api().refine();flush(280);
assert.equal(api().snapshot().value,projected.value);
assert.ok(api().collect());
assert.ok(!('runes' in api().campaign().economy.pills.at(-1)));
const E=env.window.AlchemyEconomy;
assert.equal(E.TOOL_DEFS.length,7);
assert.equal(E.buy(api().campaign(),'material',2),false);
for(const [turn,bonusRate,waitDays] of [[1,.10,2],[14,.10,2],[15,.18,3],[30,.28,4],[60,.50,7],[100,.50,7]]){
  const quote=E.consignmentQuote({day:6},{...vintage,turn});
  assert.equal(quote.bonusRate,bonusRate);
  assert.equal(quote.waitDays,waitDays);
}
const ledger=api().campaign();ledger.day=7;
assert.equal(E.settleConsignments(ledger).length,1);
assert.equal(ledger.economy.coins,983);
assert.equal(E.settleConsignments(ledger).length,0);
console.log('Retirement checks passed: legacy furnace, appraised stock, refunds, slot reload, previews, four new tiers and historical payout.');
