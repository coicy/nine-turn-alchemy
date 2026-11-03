const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const url=process.argv[2]||'https://coicy.github.io/nine-turn-alchemy/?qa=20261103';
const root=path.resolve(__dirname,'../..'),out=path.join(root,'qa'),evidence=path.join(out,'evidence');
fs.mkdirSync(evidence,{recursive:true});
const command='node verify-feedback-acceptance.cjs '+JSON.stringify(url),runId='feedback-'+new Date().toISOString();
const names=['launch','render','input','coreLoop','outcome','restart'];
const checks=Object.fromEntries(names.map(k=>[k,'NOT_RUN']));
const run={schemaVersion:1,runId,environment:{url,date:new Date().toISOString(),runtime:'Microsoft Edge / Playwright / Windows',viewport:{width:1440,height:900},proxy:'http://127.0.0.1:7890',random:'Math.random fixed at 0.5 for reproducible normal-success path; game state is never injected',perspective:'Informed functional verification, not a fresh-player discoverability study'},inputTrace:[],observations:{},diagnostics:{errors:[]}};
let browser,page,current='launch';
const relative=file=>path.relative(root,file).replaceAll('\\','/');
function atomic(file,data){const temporary=file+'.tmp';fs.writeFileSync(temporary,JSON.stringify(data,null,2));fs.renameSync(temporary,file);}
async function state(){return page.evaluate(()=>({game:AlchemyGame.snapshot(),campaign:AlchemyGame.campaign(),view:AlchemyViewState.snapshot()}));}
async function trace(action){run.inputTrace.push({action,at:new Date().toISOString()});}
async function shot(name){const file=path.join(evidence,name+'.png');await page.screenshot({path:file});return relative(file);}
async function observe(key,inputs,visual){run.observations[key]={id:key,inputs,state:await state(),...(visual?{visual}: {})};checks[key]='PASS';}
async function idle(){await page.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle'&&!AlchemyOpening.active&&!AlchemyGame.snapshot().busy&&!AlchemyScene2D.busy);}
async function view(name){await trace('click navigation '+name);await page.locator('.world-location-toggle').click();await page.locator('.engine-nav [data-view="'+name+'"]').click();await idle();}
async function scenePoint(name){return page.evaluate(name=>{const c=document.querySelector('#alchemyScene'),r=c.getBoundingClientRect(),s=AlchemyScene2D,o=name==='mouth'?s.mouth:name==='firebox'?s.firebox:s.objects[name];return {x:r.x+(o.x+o.w/2)*r.width/c.width,y:r.y+(o.y+o.h/2)*r.height/c.height};},name);}
async function sceneClick(name){await trace('click canvas '+name);const t=await scenePoint(name);await page.mouse.click(t.x,t.y);}
async function load(){await trace('take enabled herb slot');await page.locator('.herb-slot[data-slot][aria-disabled="false"]').first().click();await sceneClick('mouth');await page.waitForFunction(()=>!AlchemyGame.snapshot().pillEnded);}
async function refine(){await sceneClick('firebox');await page.waitForFunction(()=>AlchemyGame.snapshot().busy);await idle();}
async function collect(){const r=await page.locator('.observation-pill').boundingBox(),t=await scenePoint('tray');await trace('drag visible observation pill to collection tray');await page.mouse.move(r.x+r.width/2,r.y+r.height/2);await page.mouse.down();await page.mouse.move(t.x,t.y,{steps:12});await page.mouse.up();await page.waitForFunction(()=>AlchemyGame.snapshot().pillEnded);}
async function finishCommission(){
  if((await state()).game.pillEnded)await load();
  for(let i=0;i<20;i++){const s=(await state()).game;if(s.delivered+s.value>=s.target)break;await refine();}
  const before=(await state()).game;assert.ok(before.delivered+before.value>=before.target,'normal UI can reach commission target');
  await collect();assert.equal((await state()).game.roundEnded,true);assert.equal((await state()).game.order.status,'completed');
}
(async()=>{try{
  atomic(path.join(out,'verification.json'),{schemaVersion:3,status:'NOT_RUN',verify:{command,exitCode:null},completeRun:{id:runId,cleanContext:true,terminal:'commission-completed-self-pill-sold',restart:'fresh-opening-day1-empty-bag-coins80',evidence:'qa/evidence/run.json'},checks,limitations:[]});
  browser=await chromium.launch({channel:'msedge',headless:true,...(url.startsWith('https:')?{proxy:{server:'http://127.0.0.1:7890'}}:{})});
  page=await browser.newPage({viewport:{width:1440,height:900}});
  page.on('pageerror',e=>run.diagnostics.errors.push(e.message));
  page.on('response',r=>{if(r.status()>=400&&r.url().startsWith(new URL(url).origin))run.diagnostics.errors.push(r.status()+' '+r.url());});
  await page.addInitScript(()=>{Math.random=()=>.5;});
  await trace('open production GitHub Pages in fresh browser context');
  const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(response.status(),200);
  await page.waitForFunction(()=>window.AlchemyAssets?.ready,null,{timeout:65000});
  await page.locator('#startButton').waitFor({state:'visible'});await observe('launch',['open production URL']);
  current='render';await trace('click start and skip opening');await page.locator('#startButton').click();await page.locator('#prologueSkip').click();await idle();
  assert.ok(await page.evaluate(()=>AlchemyScene2D.stats.drawn.includes('tray')));await observe('render',['click start','click skip opening'],await shot('initial-room'));
  current='input';await load();await observe('input',['take visible herb slot','click furnace mouth'],await shot('loaded-odds'));
  assert.equal(await page.locator('#refineOdds').isVisible(),true);assert.equal(await page.locator('#refineOdds dl>div').count(),5);
  current='coreLoop';await finishCommission();const first=await state(),receipt=await page.locator('#roomSettlement>p').innerText();assert.match(receipt,/本单完成.*\n工钱.*加赏.*\n客户留言/);
  assert.equal(first.campaign.economy.pills.length,0);assert.ok(first.game.order.gifted>0);
  const firstId=first.game.orderId;
  run.diagnostics.receipt={order:firstId,text:receipt,visual:await shot('receipt')};
  await trace('click next customer from settlement');await page.locator('#roomSettlement [data-destination="orders"]').click();await idle();await page.locator('#counterNote').waitFor({state:'visible'});
  const next=await page.locator('.counter-ticket.selected').getAttribute('data-letter');assert.notEqual(next,firstId);assert.equal(await page.locator('.counter-board').getAttribute('data-counter-state'),'pending');assert.equal((await state()).campaign.orders.filter(o=>o.status==='active').length,0);
  await trace('open next customer note at its left side');const n=await page.locator('#counterNote').boundingBox();await page.mouse.click(n.x+n.width*.2,n.y+n.height*.5);await page.locator('.accept-stamp[data-order]').waitFor({state:'visible'});await page.locator('.accept-stamp[data-order]').click();await idle();await finishCommission();
  assert.equal((await state()).campaign.orders.filter(o=>o.status==='completed').length,2);
  await trace('click settlement self-refining shortcut');await page.locator('#settlementSelfStart').click();assert.equal((await state()).view.current,'work');assert.match(await page.locator('#herbTrayHint').innerText(),/存入背包/);await load();
  assert.equal((await state()).game.order.self,true);await refine();const before=await state();await collect();const stored=await state();assert.equal(stored.campaign.economy.coins,before.campaign.economy.coins);assert.equal(stored.campaign.economy.pills.length,1);
  await trace('open bag using settlement button');await page.locator('#roomSettlement [data-destination="bag"]').click();await idle();assert.match(await page.locator('#pillBagSelected').innerText(),/出售这颗/);
  run.diagnostics.bag={beforeCoins:before.campaign.economy.coins,afterCoins:stored.campaign.economy.coins,pill:stored.campaign.economy.pills[0],visual:await shot('bag-desktop')};
  await page.setViewportSize({width:390,height:900});run.diagnostics.bag.mobileVisual=await shot('bag-mobile');assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await observe('coreLoop',['complete two commissions using canvas inputs','start self-refining from settlement','collect self pill without payment','open persistent bag']);
  current='outcome';await trace('reload and continue saved game');await page.reload();await page.locator('#startButton').click();await idle();assert.equal((await state()).campaign.economy.pills.length,1);await view('bag');
  const coins=(await state()).campaign.economy.coins,price=await page.evaluate(()=>AlchemyEconomy.saleValue(AlchemyGame.campaign(),AlchemyGame.campaign().economy.pills[0]));
  await trace('click explicit sale button on mobile');await page.locator('[data-sell-pill]').click();assert.equal((await state()).campaign.economy.pills.length,0);assert.equal((await state()).campaign.economy.coins,coins+price);
  await observe('outcome',['reload and continue','open bag','click sell pill on mobile'],await shot('sold'));run.observations.outcome.state.terminal='commission-completed-self-pill-sold';
  current='restart';await trace('open saves and confirm restart of test slot');await page.locator('.world-settings-toggle').click();await page.locator('.engine-nav .save-open').click();await page.locator('[data-reset="1"]').click();await Promise.all([page.waitForEvent('load'),page.locator('[data-reset="1"]').click()]);
  await page.locator('#startButton').click();await page.locator('#prologueStep').waitFor({state:'visible'});assert.match(await page.locator('#prologueStep').innerText(),/1 \/ 3/);
  const fresh=await state();assert.equal(fresh.campaign.day,1);assert.equal(fresh.campaign.economy.coins,80);assert.equal(fresh.campaign.economy.pills.length,0);assert.equal(fresh.campaign.orders.filter(o=>o.status==='completed').length,0);
  await observe('restart',['open save picker','click restart twice','click start'],await shot('restart'));run.observations.restart.state.restart='fresh-opening-day1-empty-bag-coins80';
  assert.deepEqual(run.diagnostics.errors,[]);console.log('PASS: production UI-only path, two successful commissions, next customer, unified receipt, own herb shortcut, self pill storage, reload, mobile explicit sale and restart');
}catch(error){checks[current]='FAIL';run.diagnostics.failure={check:current,message:error.message,stack:error.stack};if(page){try{run.diagnostics.failure.visual=await shot('failure');run.diagnostics.failure.state=await state();}catch{}}process.exitCode=1;console.error(error);
}finally{
  atomic(path.join(evidence,'run.json'),run);
  atomic(path.join(out,'verification.json'),{schemaVersion:3,status:names.every(k=>checks[k]==='PASS')&&!process.exitCode?'PASS':'FAIL',verify:{command,exitCode:process.exitCode||0},completeRun:{id:runId,cleanContext:true,terminal:'commission-completed-self-pill-sold',restart:'fresh-opening-day1-empty-bag-coins80',evidence:'qa/evidence/run.json'},checks,limitations:[{scope:'product',reason:'Informed deterministic verification; first-time discovery, subjective fun and long-term balance are not established.'},{scope:'target device',reason:'390px viewport uses desktop Edge pointer input; physical mobile touch/performance and TapTap Maker runtime are not tested.'},{scope:'design',reason:'QTE, batch selling, auction and barter remain unimplemented and are not certified by this functional PASS.'}]});
  if(browser)await browser.close();
}})();
