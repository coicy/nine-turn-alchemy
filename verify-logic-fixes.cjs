// Regression for the 2026-11-25 logic & HTML structure audit:
// 1. scar records without 淬火盏 (enabling scar_ruler, ember_tray, scorch_seal, client preferences)
// 2. 回纹托 buffer granted on collecting a damaged pill (not on damage or explosion)
// 3. 逆火符 + 断续索 + 双仪环 stacked turn bonus & accurate successValuePreview
// 4. 九转归元 yuanBonus included in submission progress & preview reward == settled reward
// 5. 造物模 ordinary sale bonus & craft consignment exclusion
// 6. Legacy non-ASCII artifact id migration & optional Crafts guard
// 7. Valid HTML head/body placement & ES2020-safe runtime APIs
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const E=require('./economy.js');

// 6. Legacy non-ASCII artifact ids migrate in place without losing purchases or loadout.
{
  const c={day:10,economy:{coins:0,earned:0,spent:0,stock:[0,0],tools:['seal','\u4f59\u6599\u56ca','consign\u724c'],equipped:['consign\u724c','\u4f59\u6599\u56ca'],furnace:0,sold:0,pills:[{id:'P1',value:50,turn:3,refinement:{equipped:['\u4f59\u6599\u56ca']}}]}};
  E.ensure(c);
  assert.deepEqual(c.economy.tools,['seal','material_pouch','consign_plate']);
  assert.deepEqual(c.economy.equipped,['consign_plate','material_pouch']);
  assert.deepEqual(c.economy.pills[0].refinement.equipped,['material_pouch']);
  assert.ok(E.TOOL_DEFS.every(t=>/^[a-z_]+$/.test(t.id)),'all artifact ids are ASCII snake_case');
}

// 5. 造物模 boosts ordinary craft saleValue, 市价签 applies to pills only, crafts cannot be consigned.
{
  const c={day:10,phase:'open',economy:{coins:500,tools:['market_tag','craft_mold','ember_tray'],equipped:[],stock:[0,0],craftStock:{},pills:[],consignments:[],consignmentSeq:1}};
  E.ensure(c);
  const craft={id:'C1',craftKind:'bird',craftCost:90,value:100,yuanBonus:0,turn:10,quality:1};
  const pill={id:'P2',value:100,yuanBonus:0,turn:10,quality:1,scars:1};
  assert.equal(E.saleValue(c,craft),100);
  c.economy.equipped=['market_tag'];
  assert.equal(E.saleValue(c,craft),100,'market_tag does not inflate crafts');
  assert.equal(E.saleValue(c,pill),108,'market_tag boosts pills');
  c.economy.equipped=['craft_mold'];
  assert.equal(E.saleValue(c,craft),112,'craft_mold boosts ordinary craft sales');
  c.economy.equipped=['ember_tray'];
  assert.equal(E.saleValue(c,pill),108,'ember_tray boosts scarred pills without repair');
  E.storePill(c,craft);
  assert.equal(E.consignmentEligibility(c,c.economy.pills[0]).ok,false,'crafts cannot enter pill consignment');
}

const base=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split("const click=id=>")[0]
 .replace('Event:class{constructor(type){this.type=type}}','Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}}')
 .replace("window.scrollTo=()=>{};","window.scrollTo=()=>{};window.localStorage=auditStorage;")
 .replace('globalThis.testApi={getState:()=>state,render};','globalThis.testApi={getState:()=>state,render,resolveRefine,getCampaign:()=>campaign};')
 .replace('vm.runInContext(source,context);',"vm.runInContext(fs.readFileSync(__dirname+'/crafts.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);");
const store=new Map(),storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)};
const outer={require,__dirname,console,auditStorage:storage};vm.createContext(outer);
vm.runInContext(base+';globalThis.env={window,document,el,flush,context};',outer);
const env=outer.env,api=()=>env.window.AlchemyGame,t=env.context.testApi,click=id=>env.el(id).click();
const economy=()=>t.getCampaign().economy;
function equip(...ids){const e=economy();e.tools=[...new Set([...(e.tools||[]),...ids])];e.equipped=ids;}
function refineAs(roll,explode){if(explode!==undefined)t.getState().riskResult.explode=explode;env.context.Math.random=()=>roll;t.resolveRefine();env.context.Math.random=()=>0.5;}
function pour(){click('herbObject');click('fireObject');env.flush(720);}
function collect(){click('pillVisual');click('trayObject');env.flush(320);}

click('startButton');

// 1. Real damage marks scars without 淬火盏, enabling scar_ruler stacking and unscarred rejection.
equip('scar_ruler');pour();
refineAs(0.99,0);
assert.equal(t.getState().pill.scars,1,'first damage recorded without repair');
const poolAfterFirst=t.getState().pill.yuanPool;
assert.equal(poolAfterFirst,3,'first scar grants +3 yuanPool intact');
refineAs(0.99,0);
assert.equal(t.getState().pill.scars,2,'second damage increments scars without repair');
assert.ok(t.getState().pill.yuanPool>7.5,'scar_ruler scales with scars===2 (+6 on top of decayed prior pool)');
const hua=require('./customer-catalog.js').specialArcs['special-hua'].stages[1];
if(hua.traitRule==='unscarred'){
  assert.equal(E.evaluateSpecialTrait({arcId:'special-hua',arcStage:1},[{scars:t.getState().pill.scars,value:50}]),null,'unscarred preference rejects a damaged pill');
}

// 2. 回纹托 grants the next-furnace buffer on collecting a damaged pill, not on damage or explosion.
equip('pattern_tray');refineAs(0.99,0);
assert.equal(economy().nextRiskBuffer||0,0,'no buffer before collecting');
collect();
assert.equal(economy().nextRiskBuffer,1,'collecting a damaged pill grants one buffer');
const collectedScarredId=economy().pills[economy().pills.length-1].id;
economy().nextRiskBuffer=0;
assert.ok(api().returnPill(collectedScarredId),'return scarred pill to furnace');
collect();
assert.equal(economy().nextRiskBuffer,0,'re-collecting the same returned pill does not farm extra buffers');

pour();refineAs(0.99,0);refineAs(0.99,1);
assert.equal(t.getState().pillEndReason,'explode');
assert.equal(economy().nextRiskBuffer||0,0,'explosion after damage does not grant a buffer');

// 3. 逆火符 + 断续索 + 双仪环 stack turn bonuses instead of overwriting, matching successValuePreview.
assert.ok(api().abandonOrder(),'close first order before accepting D1-2');
assert.ok(api().chooseOrder('D1-2'));
equip('reverse_fire','broken_link','chain');
pour();
refineAs(0.5,0); // ordinary success -> turn 2, successChain = 1
assert.equal(t.getState().pill.turn,2);
assert.equal(t.getState().pill.successChain,1);
t.getState().pill.toolTurnBonus=1; // armed by prior reverse_fire across hold
refineAs(0.8,0); // hold -> broken_link keeps successChain = 1, toolTurnBonus stays 1
assert.equal(t.getState().pill.successChain,1);
assert.equal(t.getState().pill.toolTurnBonus,1);
const preview=api().successValuePreview();
assert.equal(preview.turn,5,'preview reflects +1 base +1 reverse_fire +1 chain');
refineAs(0.5,0); // ordinary success -> chain hits 2 (+1) + reverse_fire (+1) + base (+1) = +3 -> turn 5
assert.equal(t.getState().pill.turn,5,'both turn bonuses stack cleanly');
assert.equal(t.getState().pill.value,preview.value,'preview value matches actual settled value');
collect();

// 4. 九转归元 yuanBonus counts toward order completion & preview reward equals settled reward.
const activeTarget=t.getCampaign().orders.find(o=>o.id===t.getCampaign().activeId).target;
equip('cooling_tag','medicine_seal');
pour();
t.getState().pill.turn=9;
t.getState().pill.value=activeTarget-10;
t.getState().pill.yuanBonus=30;
t.render();
collect();
const yuanPill=economy().pills[economy().pills.length-1];
const quote=api().previewSubmission(yuanPill.id),coinsBefore=economy().coins;
assert.equal(quote.potency,activeTarget+20,'potency includes yuanBonus');
assert.equal(quote.complete,true,'yuanBonus completes the order target');
assert.ok(api().submit(yuanPill.id));
assert.equal(economy().coins-coinsBefore,quote.reward,'preview reward matches settled reward 1:1');
assert.ok(quote.reward>E.commissionReward({target:activeTarget},[yuanPill]),'preview includes artifact bonuses');

// 7. HTML structure & ES2020-safe runtime APIs.
for(const entry of ['index.html','index-warm-cinnabar.html']){
  const html=fs.readFileSync(__dirname+'/'+entry,'utf8');
  const bodyEnd=html.indexOf('</body>'),headEnd=html.indexOf('</head>');
  assert.ok(headEnd>0&&bodyEnd>headEnd,entry+' has ordered head and body');
  assert.ok(!/<(script|link)\b/i.test(html.slice(bodyEnd)),entry+' has no script or link tags after </body>');
  assert.ok(!/<link\b[^>]*rel="stylesheet"/i.test(html.slice(headEnd)),entry+' keeps all stylesheets inside <head>');
}
const formalHtml=fs.readFileSync(__dirname+'/index.html','utf8');
const formalRefs=[...formalHtml.matchAll(/<(?:script[^>]+src|link[^>]+rel="stylesheet"[^>]+href)="([^"]+)"/g)].map(m=>m[1]);
assert.ok(formalRefs.length>100);
assert.ok(formalRefs.every(u=>u.endsWith('?v=220')),'index.html uses uniform ?v=220 cache revision');

const scripts=[...new Set(formalRefs.map(u=>u.split('?')[0]))];
for(const file of scripts){
  const src=fs.readFileSync(__dirname+'/'+file,'utf8');
  assert.ok(!/\.findLast(Index)?\(|\.at\(-?\d|Object\.hasOwn\(|\.replaceAll\(/.test(src),file+' uses an ES2021+ API');
}

console.log('PASS logic & HTML structure fixes: scars without repair, pattern_tray on collect, stacked turn bonuses, yuanBonus submission & preview parity, craft_mold & consignment guard, legacy id migration, valid HTML & WebView-safe APIs');
