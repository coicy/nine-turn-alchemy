const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const url=pathToFileURL(path.join(__dirname,'index.html')).href;
  await p.goto(url);await p.locator('#startButton').click();
  assert.match(await p.locator('#prologueStep').innerText(),/1 \/ 3/);
  await p.locator('#prologueNext').click();assert.match(await p.locator('#prologueTitle').innerText(),/第一位客人/);await p.locator('#prologueNext').click();assert.match(await p.locator('#prologueTitle').innerText(),/第一炉火/);await p.locator('#prologueNext').click();
  assert.equal(await p.locator('[data-view="shop"]').isVisible(),false);
  assert.equal(await p.locator('.scene-loadout').isVisible(),false);
  assert.match(await p.locator('#workInstruction').innerText(),/先点药包/);
  await p.locator('.herb-slot[data-slot="0"]').click();
  async function clickScene(o){const pos=await p.evaluate(o=>{const canvas=document.querySelector('#alchemyScene'),r=canvas.getBoundingClientRect();return{x:r.x+o.x*r.width/canvas.width,y:r.y+o.y*r.height/900};},o);await p.mouse.click(pos.x,pos.y);}
  await clickScene(await p.evaluate(()=>({x:AlchemyScene2D.mouth.x+AlchemyScene2D.mouth.w/2,y:AlchemyScene2D.mouth.y+AlchemyScene2D.mouth.h/2})));
  await p.waitForFunction(()=>!AlchemyGame.snapshot().pillEnded);
  assert.match(await p.locator('#workInstruction').innerText(),/炼化一次/);
  await p.evaluate(()=>{Math.random=()=>0;});
  await clickScene(await p.evaluate(()=>({x:AlchemyScene2D.firebox.x+AlchemyScene2D.firebox.w/2,y:AlchemyScene2D.firebox.y+AlchemyScene2D.firebox.h/2})));
  await p.waitForFunction(()=>AlchemyGame.snapshot().turn>1&&!AlchemyGame.snapshot().busy);
  assert.equal(await p.locator('#roomFacts > div:nth-child(2)').isVisible(),false);
  assert.equal(await p.locator('#roomFacts > div:nth-child(3)').isVisible(),true);
  assert.equal(await p.locator('#roomFacts > div:nth-child(4)').isVisible(),true);
  await p.waitForTimeout(2600);
  const out=path.resolve(__dirname,'../../Evidence/OnboardingV54');fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.screenshot({path:path.join(out,'first-furnace-'+width+'.png')});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  // Finish the first order and check that only the next relevant feature appears.
  await p.evaluate(()=>{AlchemyGame.collect();for(let i=0;i<2&&!AlchemyGame.snapshot().roundEnded;i++){AlchemyGame.load();AlchemyGame.collect();}});
  assert.equal(await p.locator('[data-view="orders"]').isVisible(),true);
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),false);
  await p.locator('#roomSettlement [data-destination="orders"]').click();
  await p.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle');
  assert.equal(await p.locator('#dailyOrders').isVisible(),false);
  assert.match(await p.locator('#counterLetter .letter-kicker').innerText(),/待接单/);
  await p.locator('.browse-customers').click();assert.equal(await p.locator('#dailyOrders').isVisible(),true);
  await p.locator('.browse-customers').click();
  await p.locator('.accept-stamp').click();await p.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle');
  assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().roundEnded),false);
  await p.reload();await p.locator('#startButton').click();
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),false);
  await p.evaluate(()=>{localStorage.clear();});await p.reload();
  await p.locator('#startButton').click();await p.locator('#prologueSkip').click();
  await p.locator('.onboarding-expand').click();
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),true);
  await p.reload();await p.locator('#startButton').click();
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),true);
  // Success gifts introduce self-refining; buying a tool reveals its equipment entry.
  await p.evaluate(()=>localStorage.clear());await p.reload();
  await p.locator('#startButton').click();await p.locator('#prologueSkip').click();
  await p.evaluate(()=>{Math.random=()=>.5;AlchemyGame.load();});
  for(let i=0;i<30&&await p.evaluate(()=>AlchemyGame.snapshot().value<AlchemyGame.snapshot().target);i++){
    await p.evaluate(()=>AlchemyGame.refine());await p.waitForFunction(()=>!AlchemyGame.snapshot().busy);
  }
  await p.evaluate(()=>AlchemyGame.collect());
  assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().order.status),'completed');
  assert.equal(await p.locator('[data-view="shop"]').isVisible(),true);
  assert.equal(await p.locator('[data-view="manual"]').isVisible(),false);
  await p.locator('#roomSettlement [data-destination="shop"]').click();
  await p.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle');
  assert.match(await p.locator('.market-heading').innerText(),/余药/);
  assert.equal(await p.locator('[data-inspect="phoenix"]').count(),0);
  await p.screenshot({path:path.join(out,'market-context.png')});
  await p.locator('[data-view="orders"]').click();await p.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle');
  await p.screenshot({path:path.join(out,'recommended-customer.png')});
  await p.locator('#settleDay').click();assert.equal(await p.evaluate(()=>AlchemyGame.campaign().phase),'open');
  assert.match(await p.locator('#dailySummary').innerText(),/未接委托会跳过/);
  await p.locator('#settleDay').click();assert.equal(await p.evaluate(()=>AlchemyGame.campaign().phase),'settled');
  await p.locator('#nextDay').click();
  assert.equal(await p.locator('[data-view="manual"]').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: three-shot opening, real pointer load/refine, reduced facts, desktop/mobile layouts, contextual navigation, recommended customer and second-order acceptance, resume and explicit full-function preference; no page errors');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
