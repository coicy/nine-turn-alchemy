const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{
 const b=await chromium.launch({channel:'msedge',headless:true});
 try {
  const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  const url=pathToFileURL(path.join(__dirname,'index.html')).href;
  await p.goto(url);await p.locator('#startButton').click();
  assert.match(await p.locator('#prologueStep').innerText(),/1 \/ 1/);
  await p.locator('#prologueNext').click();
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
  assert.equal(await p.locator('#roomFacts > div:nth-child(4)').isVisible(),true);
  await p.waitForTimeout(2600);
  const out=path.resolve(__dirname,'../../Evidence/OnboardingV53');fs.mkdirSync(out,{recursive:true});
  for(const width of [1440,390]){await p.setViewportSize({width,height:900});await p.screenshot({path:path.join(out,'first-furnace-'+width+'.png')});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);}
  // Even a failed first order opens the rest of the game; no success gate.
  await p.evaluate(()=>{AlchemyGame.collect();for(let i=0;i<2&&!AlchemyGame.snapshot().roundEnded;i++){AlchemyGame.load();AlchemyGame.collect();}});
  assert.equal(await p.locator('[data-view="orders"]').isVisible(),true);
  assert.equal(await p.locator('[data-view="shop"]').isVisible(),true);
  await p.reload();await p.locator('#startButton').click();
  assert.equal(await p.locator('[data-view="shop"]').isVisible(),true);
  await p.evaluate(()=>{localStorage.clear();});await p.reload();
  await p.locator('#startButton').click();await p.locator('#prologueSkip').click();
  await p.locator('.onboarding-expand').click();
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),true);
  await p.reload();await p.locator('#startButton').click();
  assert.equal(await p.locator('[data-view="equipment"]').isVisible(),true);
  assert.deepEqual(errors,[]);
  console.log('PASS: single-shot opening, real pointer load/refine, reduced facts, desktop/mobile layouts, first-order unlock, resume and explicit full-function preference; no page errors');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
