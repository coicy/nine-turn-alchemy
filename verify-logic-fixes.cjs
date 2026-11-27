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

// 7. HTML structure, bundle synchronization, WebP-only asset refs & ES2020-safe runtime APIs.
const buildVer=fs.readFileSync(__dirname+'/VERSION','utf8').trim().toLowerCase();
for(const entry of ['index.html','index-warm-cinnabar.html']){
  const html=fs.readFileSync(__dirname+'/'+entry,'utf8');
  const bodyEnd=html.indexOf('</body>'),headEnd=html.indexOf('</head>');
  assert.ok(headEnd>0&&bodyEnd>headEnd,entry+' has ordered head and body');
  assert.ok(!/<(script|link)\b/i.test(html.slice(bodyEnd)),entry+' has no script or link tags after </body>');
  assert.ok(!/<link\b[^>]*rel="stylesheet"/i.test(html.slice(headEnd)),entry+' keeps all stylesheets inside <head>');
}
const formalHtml=fs.readFileSync(__dirname+'/index.html','utf8');
const formalRefs=[...formalHtml.matchAll(/<(?:script[^>]+src|link[^>]+rel="stylesheet"[^>]+href)="([^"]+)"/g)].map(m=>m[1]);
assert.equal(formalRefs.length,2,'index.html bundles down to 2 requests (bundle.css + bundle.js)');
assert.deepEqual(formalRefs,[`bundle.css?v=${buildVer.slice(1)}`,`bundle.js?v=${buildVer.slice(1)}`],'index.html references versioned bundle.css and bundle.js matching VERSION');

const manifest=JSON.parse(fs.readFileSync(__dirname+'/bundle-manifest.json','utf8'));
for(const file of manifest.scripts){
  const src=fs.readFileSync(__dirname+'/'+file,'utf8');
  assert.ok(!/\.findLast(Index)?\(|\.at\(-?\d|Object\.hasOwn\(|\.replaceAll\(/.test(src),file+' uses an ES2021+ API');
}
for(const file of [...manifest.styles,...manifest.scripts,'index.html','index-warm-cinnabar.html']){
  const src=fs.readFileSync(__dirname+'/'+file,'utf8');
  assert.ok(!/assets\/[^\s"')<>`]+\.png\b/.test(src),file+' still references archived .png assets');
  for(const m of src.matchAll(/assets\/[A-Za-z0-9_./-]+\.webp/g)){
    assert.ok(fs.existsSync(__dirname+'/'+m[0]),file+' references missing WebP: '+m[0]);
  }
}
const cp=require('node:child_process');
cp.execFileSync(process.execPath,[__dirname+'/build-bundle.cjs','--check'],{stdio:'pipe'});

// 8. Balance rebalance invariants: great ×1.11, cross-pill ritualCharge (9 manual -> 5 safe), 5/10 start & Gao gate, rent & fee.
{
  const C=require('./campaign.js'),L=require('./lease.js');
  const fresh=C.create();
  assert.equal(fresh.reputation,5,'new campaign starts at 5/10 reputation');
  assert.ok([3,4].includes(fresh.orders.length),'initial 5 reputation generates 3-4 daily orders');
  assert.equal(E.fee({target:100}),52,'fee uses 36 + round(target*0.16)');
  L.ensure(fresh);
  assert.deepEqual(fresh.lease.terms.map(x=>[x.day,x.amount]),[[7,120],[14,280],[21,440],[28,560]]);
  // Reputation < 6 keeps imperial-gao locked even on Day 10; rising to 6 unlocks it.
  const gaoTest=C.create();gaoTest.day=10;gaoTest.orders=C.ordersFor(10,()=>.5,gaoTest.reputation);
  gaoTest.specialArcs={'special-hua':{stage:2,lastDay:8},'special-bai':{stage:2,lastDay:8},'special-qin':{stage:2,lastDay:8},'special-jiao':{stage:2,lastDay:8},'special-cui':{stage:2,lastDay:8}};
  C.scheduleSpecialForDay(gaoTest);
  assert.equal(gaoTest.orders.some(o=>o.arcId==='imperial-gao'),false,'5/10 initial reputation does not meet Gao threshold (6)');
  gaoTest.reputation=6;gaoTest.orders=C.ordersFor(10,()=>.5,gaoTest.reputation);
  C.scheduleSpecialForDay(gaoTest);
  assert.equal(gaoTest.orders.some(o=>o.arcId==='imperial-gao'),true,'completing commissions to 6/10 unlocks Gao');

  // Great success persistent multiplier & cross-pill ritualCharge (safe steps do not charge, only manual non-safe does).
  const bStore=new Map(),bStorage={getItem:k=>bStore.get(k)||null,setItem:(k,v)=>bStore.set(k,v)};
  const brushEnv={require,__dirname,console,auditStorage:bStorage};
  const bBase=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split("const click=id=>")[0]
    .replace('Event:class{constructor(type){this.type=type}}','Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}}')
    .replace("window.scrollTo=()=>{};","window.scrollTo=()=>{};window.localStorage=auditStorage;")
    .replace('globalThis.testApi={getState:()=>state,render};','globalThis.testApi={getState:()=>state,render,resolveRefine,getCampaign:()=>campaign};')
    .replace('vm.runInContext(source,context);',"let ritualCb=null;window.AlchemyRitualBrush={begin(p,save,cb){ritualCb=cb;},seal(){}};globalThis.__fireRitual=()=>ritualCb&&ritualCb();vm.runInContext(fs.readFileSync(__dirname+'/crafts.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);");
  vm.createContext(brushEnv);
  vm.runInContext(bBase+';globalThis.env={window,el,flush,context};',brushEnv);
  const bApi=()=>brushEnv.env.window.AlchemyGame,bt=brushEnv.env.context.testApi,bClick=id=>brushEnv.env.el(id).click();
  bClick('startButton');
  bClick('herbObject');bClick('fireObject');brushEnv.env.flush(720);
  // Great success (roll 0.01) yields turn 3 and persistent 1.11 multiplier over normal base value.
  bt.getState().riskResult.explode=0;brushEnv.env.context.Math.random=()=>0.01;bt.resolveRefine();
  assert.equal(bt.getState().pill.turn,3);
  assert.ok(Math.abs((bt.getState().pill.valueFactor||1)-1.11)<1e-9,'great success stacks 1.11 multiplier');
  assert.equal(bApi().snapshot().ritualCharge,1,'first manual refine adds 1 ritual charge');
  // Equip pattern_tray and collect scarred pill -> next furnace gets 1 buffer step that does NOT add ritualCharge.
  bt.getCampaign().economy.tools=['pattern_tray'];bt.getCampaign().economy.equipped=['pattern_tray'];
  brushEnv.env.context.Math.random=()=>0.99;bt.resolveRefine(); // charge=2, scars=1
  assert.equal(bApi().snapshot().ritualCharge,2);
  bClick('pillVisual');bClick('trayObject');brushEnv.env.flush(320);
  assert.equal(bt.getCampaign().economy.nextRiskBuffer,1);
  bClick('herbObject');bClick('fireObject');brushEnv.env.flush(720);
  assert.equal(bt.getState().pill.ritualSafe,1);
  assert.equal(bApi().snapshot().ritualCharge,2,'new pill preserves cross-pill ritualCharge=2');
  brushEnv.env.context.Math.random=()=>0.5;bt.resolveRefine(); // buffer safe step: should NOT increment charge!
  assert.equal(bApi().snapshot().ritualCharge,2,'pattern_tray safe buffer step does not charge ritual');
  // 7 more manual refines reach 9/9 -> ritualActive, complete ritual -> charge=0, ritualSafe=5, 5 safe runs leave charge at 0.
  for(let i=0;i<7;i++){bt.getState().riskResult.explode=0;brushEnv.env.context.Math.random=()=>0.5;bt.resolveRefine();}
  assert.equal(bApi().snapshot().ritualCharge,9);
  assert.equal(bApi().snapshot().ritualActive,true);
  brushEnv.__fireRitual();
  assert.equal(bApi().snapshot().ritualCharge,0,'completing ritual resets charge to 0');
  assert.equal(bt.getState().pill.ritualSafe,5,'ritual grants 5 safe steps');
  assert.equal(bt.getState().pill.ritualTotal,5);
  for(let i=0;i<5;i++){brushEnv.env.context.Math.random=()=>0.5;brushEnv.env.flush(850);}
  assert.equal(bt.getState().pill.ritualSafe,0);
  assert.equal(bApi().snapshot().ritualCharge,0,'safe auto refines never recharge ritualCharge');
}

// 9. 归险尺 (risk_ruler): real explosion risk conversion, Nine-Turn Return multiplier, per-pill 30% (+60%) cap expiration & returnPill guard.
{
  assert.ok(E.TOOL_DEFS.find(t=>t.id==='risk_ruler').description.includes('30%'),'risk_ruler copy states exact 30% cap');
  assert.equal(E.riskRulerShift([],{turn:5},0.25),0,'unequipped yields zero shift');
  assert.equal(E.riskRulerShift(['risk_ruler'],{turn:1,riskRulerConverted:0},0),0,'zero raw risk yields zero shift');
  assert.ok(Math.abs(E.riskRulerShift(['risk_ruler'],{turn:5,riskRulerConverted:0},0.25)-0.05)<1e-12,'shifts 20% of raw risk');
  assert.ok(Math.abs(E.riskRulerShift(['risk_ruler'],{turn:10,riskRulerConverted:0.27},0.4)-0.03)<1e-12,'clamps shift by remaining cap headroom');
  assert.equal(E.riskRulerShift(['risk_ruler'],{turn:10,riskRulerConverted:0.3},0.4),0,'expired cap yields zero shift');

  const rStore=new Map(),rStorage={getItem:k=>rStore.get(k)||null,setItem:(k,v)=>rStore.set(k,v)};
  const rEnv={require,__dirname,console,auditStorage:rStorage};
  const rBase=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split("const click=id=>")[0]
    .replace('Event:class{constructor(type){this.type=type}}','Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}}')
    .replace("window.scrollTo=()=>{};","window.scrollTo=()=>{};window.localStorage=auditStorage;")
    .replace('globalThis.testApi={getState:()=>state,render};','globalThis.testApi={getState:()=>state,render,resolveRefine,getCampaign:()=>campaign};')
    .replace('vm.runInContext(source,context);',"vm.runInContext(fs.readFileSync(__dirname+'/crafts.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);");
  vm.createContext(rEnv);
  vm.runInContext(rBase+';globalThis.env={window,el,flush,context};',rEnv);
  const rApi=()=>rEnv.env.window.AlchemyGame,rt=rEnv.env.context.testApi,rClick=id=>rEnv.env.el(id).click();
  const rEco=()=>rt.getCampaign().economy;
  function rEquip(...ids){rEco().tools=[...new Set([...(rEco().tools||[]),...ids])];rEco().equipped=ids;}
  function rStep(roll=0.5){rEnv.env.context.Math.random=()=>roll;rt.resolveRefine();rEnv.env.context.Math.random=()=>0.5;}

  rClick('startButton');
  rEquip('risk_ruler');
  rClick('herbObject');rClick('fireObject');rEnv.env.flush(720);

  // Turn 1 has 0% risk -> no shift.
  assert.equal(rt.getState().riskResult.explode,0);
  assert.equal(rApi().refinementProbabilities().rulerShift,0);

  // Advance Turn 1->8 naturally, confirming live shift & Nine-Turn Return payout math at Turn 9.
  for(let i=0;i<7;i++)rStep(0.5); // Turn 1 -> 8 (0%..38.3% risks all < 0.5; roll 0.5 -> ordinary success)
  assert.equal(rt.getState().pill.turn,8);
  const snap8=rApi().snapshot(),prob8=rApi().refinementProbabilities();
  assert.ok(prob8.rulerShift>0,'live odds expose risk_ruler shift before Turn 9');
  assert.ok(Math.abs(prob8.baseExplosion-(rt.getState().riskResult.rawExplode-prob8.rulerShift))<1e-12,'displayed explode already subtracts rulerShift');
  assert.ok(snap8.toolProgress.riskRulerConverted>0&&snap8.toolProgress.riskRulerConverted<0.3);
  assert.ok(Math.abs(snap8.toolProgress.riskRulerBonus-snap8.toolProgress.riskRulerConverted*2)<1e-12);

  // safeRun step must NOT convert risk or consume cap.
  rt.getState().pill.ritualSafe=1;
  const convBeforeSafe=rt.getState().pill.riskRulerConverted,bonusBeforeSafe=rt.getState().pill.riskRulerBonus;
  assert.equal(rApi().refinementProbabilities().rulerShift,0,'safeRun shows zero rulerShift');
  rStep(0.5); // consumes ritualSafe -> Turn 8 -> Turn 9 (actually advances turn via safe step!)
  // Wait: Turn 8 safe step advances to Turn 9 without consuming ruler cap, let's check riskRulerBonus paid out with preserved bonus!
  assert.equal(rt.getState().pill.riskRulerConverted,convBeforeSafe,'safeRun does not increment riskRulerConverted');
  assert.equal(rt.getState().pill.yuanNode,1,'crossed 9-turn node');
  assert.equal(rt.getState().pill.riskRulerBonus,0,'nine-turn payout clears banked multiplier');
  assert.ok(rt.getState().pill.yuanBonus>0,'yuanBonus cashed out with ruler multiplier');
  assert.ok(rt.getState().pill.triggers.some(msg=>msg.includes('归险尺')&&msg.includes('归元药力')),'payout logs risk_ruler multiplier trigger');
  assert.ok(bonusBeforeSafe>0,'banked bonus existed before safe payout');

  // Verify exact multiplier arithmetic (1 + bonus) on clean Turn 8->9 payout without old 1.12 placeholder.
  rClick('pillVisual');rClick('trayObject');rEnv.env.flush(320);
  assert.ok(rApi().abandonOrder());
  assert.ok(rApi().chooseOrder('D1-2'));
  rClick('herbObject');rClick('fireObject');rEnv.env.flush(720);
  for(let i=0;i<7;i++)rStep(0.5); // Turn 8
  const convT8=rt.getState().pill.riskRulerConverted;
  const shiftT8=rt.getState().riskResult.rulerShift;
  const poolBeforeT8=rt.getState().pill.yuanPool;
  const beforeValT8=rt.getState().pill.value;
  const explodeT8=rt.getState().riskResult.explode;
  const expectedPool=poolBeforeT8+beforeValT8*explodeT8;
  const expectedMult=1+(convT8+shiftT8)*2;
  rStep(0.5); // Turn 8 -> 9 non-safe
  assert.equal(rt.getState().pill.turn,9);
  assert.equal(rt.getState().pill.yuanBonus,Math.round(expectedPool*expectedMult),'payout equals exact yuanPool * (1 + 2 * convertedRisk)');

  // Continue refining high turns until 30% cap is hit; verify immediate expiration & unreduced risk afterward.
  let guard=0;
  while(!rApi().snapshot().toolProgress.riskRulerExpired&&guard++<20){
    const safeRoll=Math.min(0.95,Math.max(0.5,(rt.getState().riskResult.explode||0)+0.05));
    // keep between hold/success? Pick a roll cleanly above explode for outcome RNG (test uses same Math.random for both)
    // Wait: both explode check AND outcome check use Math.random(), so set separate sequence or push roll cleanly in [explode,1):
    // If explode <= 0.65, roll=0.66 triggers 'hold' (or lower if < big+success+hold=0.905 -> hold/damage). Easier: advance with 2-step random sequence!
    let seq=[0.99,0.5];
    rEnv.env.context.Math.random=()=>seq.length?seq.shift():0.5;
    rt.resolveRefine();
  }
  const snapCap=rApi().snapshot();
  assert.equal(snapCap.toolProgress.riskRulerExpired,true,'reached 30% cap');
  assert.equal(snapCap.toolProgress.riskRulerConverted,0.3,'converted clamped at 0.30');
  assert.equal(rt.getState().riskResult.rulerShift,0,'next step immediately sees 0 rulerShift after cap');
  assert.ok(Math.abs(rt.getState().riskResult.explode-rt.getState().riskResult.rawExplode)<1e-12,'explosion risk returns to raw unreduced rate immediately after cap');
  assert.ok(rt.getState().pill.triggers.some(msg=>msg.includes('已达上限，本炉失效')),'cap step logs expiration');

  // Refining once more after cap does not convert further or grow multiplier.
  const bonusAtCap=rt.getState().pill.riskRulerBonus;
  let seqPost=[0.99,0.5];
  rEnv.env.context.Math.random=()=>seqPost.length?seqPost.shift():0.5;
  rt.resolveRefine();
  assert.equal(rt.getState().pill.riskRulerConverted,0.3,'stays at 0.30 post-cap');
  assert.equal(rt.getState().pill.riskRulerBonus,bonusAtCap,'multiplier stays frozen post-cap');

  // Test collect + exact returnPill & legacy returnPill cap guard, plus fresh pill reset.
  rClick('pillVisual');rClick('trayObject');rEnv.env.flush(320);
  // Also test partial pill round-trip on a fresh furnace:
  rClick('herbObject');rClick('fireObject');rEnv.env.flush(720);
  assert.equal(rt.getState().pill.riskRulerConverted,0,'new pill resets riskRulerConverted');
  assert.equal(rt.getState().pill.riskRulerBonus,0,'new pill resets riskRulerBonus');
  assert.equal(rApi().snapshot().toolProgress.riskRulerExpired,false,'new pill is active');
  for(let i=0;i<5;i++)rStep(0.5); // Turn 6
  const savedConv=rt.getState().pill.riskRulerConverted,savedBonus=rt.getState().pill.riskRulerBonus,savedShift=rt.getState().riskResult.rulerShift;
  rClick('pillVisual');rClick('trayObject');rEnv.env.flush(320);
  const partialPillId=rEco().pills[rEco().pills.length-1].id;
  assert.ok(rApi().returnPill(partialPillId));
  assert.equal(rt.getState().pill.riskRulerConverted,savedConv,'exact returnPill preserves riskRulerConverted');
  assert.equal(rt.getState().pill.riskRulerBonus,savedBonus,'exact returnPill preserves riskRulerBonus');
  assert.ok(Math.abs(rt.getState().riskResult.rulerShift-savedShift)<1e-12,'exact returnPill preserves rulerShift');

  // Legacy returnPill (missing refinement history) locks cap to expired so it cannot be re-farmed.
  rClick('pillVisual');rClick('trayObject');rEnv.env.flush(320);
  const legacyStored=rEco().pills[rEco().pills.length-1];
  delete legacyStored.refinement;
  rt.getState().pill={turn:1,value:24}; // clear matching live id so exact fallback isn't used
  assert.ok(rApi().returnPill(legacyStored.id));
  assert.equal(rt.getState().pill.riskRulerConverted,0.3,'legacy returned pill marks riskRulerConverted at cap');
  assert.equal(rApi().snapshot().toolProgress.riskRulerExpired,true,'legacy returned pill marks risk_ruler expired');
  assert.equal(rApi().refinementProbabilities().rulerShift,0,'legacy returned pill gets zero risk_ruler shift');
}

// 10. Copy-vs-functionality audit fixes: fissure_cone persistence, guard_casket quality hold, failed_contract on abandon, lease grossValue, pattern_tray manual reload, customer settlement & rent copy.
{
  const fStore=new Map(),fStorage={getItem:k=>fStore.get(k)||null,setItem:(k,v)=>fStore.set(k,v)};
  const fEnv={require,__dirname,console,auditStorage:fStorage};
  const fBase=fs.readFileSync(__dirname+'/verify-simulation.cjs','utf8').split("const click=id=>")[0]
    .replace('Event:class{constructor(type){this.type=type}}','Event:class{constructor(type){this.type=type}},CustomEvent:class{constructor(type,init={}){this.type=type;this.detail=init.detail}}')
    .replace("window.scrollTo=()=>{};","window.scrollTo=()=>{};window.localStorage=auditStorage;")
    .replace('globalThis.testApi={getState:()=>state,render};','globalThis.testApi={getState:()=>state,render,resolveRefine,getCampaign:()=>campaign};')
    .replace('vm.runInContext(source,context);',"vm.runInContext(fs.readFileSync(__dirname+'/crafts.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/economy.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/lease.js','utf8'),context);vm.runInContext(fs.readFileSync(__dirname+'/campaign.js','utf8'),context);vm.runInContext(source,context);");
  vm.createContext(fEnv);
  vm.runInContext(fBase+';globalThis.env={window,el,flush,context};',fEnv);
  const fApi=()=>fEnv.env.window.AlchemyGame,ft=fEnv.env.context.testApi,fClick=id=>fEnv.env.el(id).click();
  const fEco=()=>ft.getCampaign().economy;
  function fEquip(...ids){fEco().tools=[...new Set([...(fEco().tools||[]),...ids])];fEco().equipped=ids;}
  function fStep(roll=0.5,explode=0){ft.getState().riskResult.explode=explode;fEnv.env.context.Math.random=()=>roll;ft.resolveRefine();fEnv.env.context.Math.random=()=>0.5;}

  fClick('startButton');

  // 10a. fissure_cone persists 3x +5% onto valueFactor and matches successValuePreview across trigger 1..3 and non-trigger 4th step.
  fEquip('fissure_cone');
  fClick('herbObject');fClick('fireObject');fEnv.env.flush(720);
  ft.getState().pill.riskPeak=0.35;ft.render();
  for(let k=1;k<=4;k++){
    const prev=fApi().successValuePreview();
    fStep(0.5,0.35);
    assert.equal(ft.getState().pill.value,prev.value,'fissure_cone step '+k+' value matches preview');
    if(k<=3)assert.equal(ft.getState().pill.fissureTriggers,k);
  }
  assert.equal(ft.getState().pill.fissureTriggers,3);
  assert.ok(Math.abs((ft.getState().pill.valueFactor||1)-Math.pow(1.05,3))<1e-9,'fissure_cone keeps all three +5% bonuses on 4th success');

  // 10b. guard_casket keeps turn === 5 AND quality === 1 (良品) when damaged at turn 5.
  fEquip('guard_casket');
  ft.getState().pill.turn=5;ft.getState().pill.quality=1;
  fStep(0.99,0); // damage
  assert.equal(ft.getState().pill.guardCasketUsed,true,'guard_casket consumed once');
  assert.equal(ft.getState().pill.turn,5,'guard_casket prevents turn drop');
  assert.equal(ft.getState().pill.quality,1,'guard_casket prevents quality drop at turn 5 boundary');

  // 10c. failed_contract refunds returned*4 coins and applies -10% target relief on abandonOrder().
  fClick('pillVisual');fClick('trayObject');fEnv.env.flush(320);
  fEquip('failed_contract');
  const coinsBeforeAbandon=fEco().coins;
  assert.ok(fApi().abandonOrder(),'abandon remaining 2-pack order');
  assert.equal(fEco().coins,coinsBeforeAbandon+8,'failed_contract refunds 2 unused packs * 4 = 8 coins on abandon');
  assert.ok(Math.abs((fEco().nextOrderTargetPenalty||0)-0.1)<1e-9,'failed_contract sets 10% next-day target penalty on abandon');

  // 10d. lease.purchaseQuote counts yuanBonus toward 120 potency threshold.
  const Lease=require('./lease.js'),C=require('./campaign.js');
  const lc=C.create();lc.day=16;lc.phase='open';Lease.ensure(lc);
  E.ensure(lc).pills=[{id:'Y1',value:95,yuanBonus:30,turn:9,quality:1,nature:'neutral'}];
  const lq=Lease.purchaseQuote(lc,'Y1');
  assert.ok(lq&&lq.payout>120,'lease purchase qualifies 95 base + 30 yuanBonus = 125 grossValue');

  // 10e. pattern_tray buffer (ritualSafe=1, ritualTotal=0) does NOT auto-fire startRitualRefines on save reload, whereas ritualTotal>0 resumes.
  fApi().chooseOrder('D1-2');
  fClick('herbObject');fClick('fireObject');fEnv.env.flush(720);
  ft.getState().pill.ritualSafe=1;ft.getState().pill.ritualTotal=0;
  assert.ok(fApi().saveNow().saved);
  const fReload={require,__dirname,console,auditStorage:fStorage};
  vm.createContext(fReload);
  vm.runInContext(fBase+';globalThis.env={window,el,flush,context};',fReload);
  const rBtn1=fReload.env.el('startButton');
  rBtn1.emit('click',{currentTarget:rBtn1});
  assert.equal(fReload.env.window.AlchemyGame.snapshot().ritualRemaining,1,'reload keeps 1 buffer step');
  assert.equal(fReload.env.window.AlchemyGame.snapshot().busy,false,'pattern_tray single shield does not auto-fire ritual refines on reload');

  ft.getState().pill.ritualSafe=3;ft.getState().pill.ritualTotal=5;
  assert.ok(fApi().saveNow().saved);
  const fReloadRitual={require,__dirname,console,auditStorage:fStorage};
  vm.createContext(fReloadRitual);
  vm.runInContext(fBase+';globalThis.env={window,el,flush,context};',fReloadRitual);
  let ritualSealed=false;
  fReloadRitual.env.window.AlchemyRitualBrush={begin(){},seal(){ritualSealed=true;}};
  const rBtn2=fReloadRitual.env.el('startButton');
  rBtn2.emit('click',{currentTarget:rBtn2});
  assert.equal(ritualSealed,true,'ritualTotal>0 triggers startRitualRefines -> seal');
  assert.equal(fReloadRitual.env.window.AlchemyGame.snapshot().ritualRemaining,3,'reload keeps 3 remaining ritual refines');
  assert.equal(fReloadRitual.env.window.AlchemyGame.snapshot().busy,true,'ritualTotal>0 resumes auto-refine on reload');

  // 10f. customers.settlement & dialogue copy checks.
  globalThis.AlchemyCustomerCatalog=require('./customer-catalog.js');
  globalThis.AlchemyEconomy=E;
  const Customers=require('./customers.js');
  const failedTxt=Customers.settlement({status:'failed',target:100,returned:2});
  assert.ok(failedTxt.includes('丹匣丹药保留')&&!failedTxt.includes('已有成丹归客'),'failed settlement keeps pills in bag');
  const pouchTxt=Customers.settlement({status:'completed',target:100,reward:56,gifted:1,materialPouchBonus:1});
  assert.ok(pouchTxt.includes('余料囊 1 包'),'completed settlement shows material_pouch bonus');
  assert.ok(!fs.readFileSync(__dirname+'/dialogue-content.js','utf8').includes('四十文'),'opening lease copy removes legacy 40-coin rent');
}

console.log('PASS logic, bundle & asset fixes: scars without repair, pattern_tray on collect, stacked turn bonuses, yuanBonus submission & preview parity, craft_mold & consignment guard, legacy id migration, 2-request bundle sync, WebP-only assets & WebView-safe APIs, risk_ruler conversion & cap, audit copy/logic fixes');
