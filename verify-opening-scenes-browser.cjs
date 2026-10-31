const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const url=process.env.ALCHEMY_TEST_URL||pathToFileURL(path.join(__dirname,'index.html')).href;
 const out=path.resolve(__dirname,'../../Evidence/OpeningScenesV01');fs.mkdirSync(out,{recursive:true});
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 const ready=page=>page.waitForFunction(()=>AlchemyViewState.snapshot().phase==='idle'&&!document.getElementById('prologueNext').disabled);
 await p.goto(url,{waitUntil:'domcontentloaded'});await p.locator('#startButton').click();await ready(p);
 assert.equal(await p.evaluate(()=>AlchemyViewState.snapshot().current),'work');assert.equal(await p.locator('.game-layout').evaluate(el=>el.inert),true);
 assert.equal(await p.locator('.engine-viewport').isVisible(),true);assert.equal(await p.locator('.prologue-table').count(),0);
 await p.waitForTimeout(500);await p.screenshot({path:path.join(out,'01-open-room.png')});
 const original=await p.evaluate(()=>AlchemyGame.snapshot().order.id);
 await p.locator('#prologueNext').click();await ready(p);
 assert.equal(await p.evaluate(()=>AlchemyViewState.snapshot().current),'orders');assert.equal(await p.locator('.counter-board').isVisible(),true);
 assert.match(await p.locator('.counter-board').evaluate(el=>getComputedStyle(el).backgroundImage),/counter.png/);
 assert.equal(await p.locator('#counterParcels img').count(),3);
 assert.match(await p.locator('#prologueText').innerText(),new RegExp(await p.evaluate(()=>AlchemyCustomers.profile(AlchemyGame.snapshot().order).name)));
 await p.waitForTimeout(700);await p.screenshot({path:path.join(out,'02-customer-counter.png')});
 await p.setViewportSize({width:390,height:844});await p.screenshot({path:path.join(out,'02-customer-counter-mobile.png')});
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 const box=await p.locator('.prologue-dialogue').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390&&box.y+box.height<=844);
 await p.locator('#prologueNext').evaluate(el=>el.blur());await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().attempt),0);
 // Re-enter the unfinished scene, preserving the actual first order and all materials.
 await p.reload();await p.locator('#startButton').click();await ready(p);
 assert.equal(await p.evaluate(()=>AlchemyOpening.snapshot().step),1);assert.equal(await p.evaluate(()=>AlchemyViewState.snapshot().current),'orders');
 assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().order.id),original);
 await p.locator('#prologueNext').click();await ready(p);assert.equal(await p.evaluate(()=>AlchemyViewState.snapshot().current),'work');
 await p.setViewportSize({width:1440,height:900});await p.screenshot({path:path.join(out,'03-ready-to-load.png')});
 await p.locator('#prologueNext').click();await p.waitForFunction(()=>!AlchemyOpening.active);
 assert.equal(await p.locator('.game-layout').evaluate(el=>el.inert),false);assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().remaining),3);
 await p.locator('.herb-slot[data-slot="0"]').click();
 const pos=await p.evaluate(()=>{const c=document.getElementById('alchemyScene'),r=c.getBoundingClientRect(),m=AlchemyScene2D.mouth;return{x:r.x+(m.x+m.w/2)*r.width/c.width,y:r.y+(m.y+m.h/2)*r.height/900};});await p.mouse.click(pos.x,pos.y);
 await p.waitForFunction(()=>AlchemyGame.snapshot().attempt===1);assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().pillEnded),false);
 await p.reload();await p.locator('#startButton').click();assert.equal(await p.evaluate(()=>AlchemyOpening.active),false);assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().attempt),1);
 assert.deepEqual(errors,[]);await p.close();
 // Skip from every beat, including a transition in flight; never spend or duplicate materials.
 for(let step=0;step<3;step++){
  const q=await browser.newPage({viewport:{width:390,height:844}});await q.emulateMedia({reducedMotion:step===2?'reduce':'no-preference'});
  await q.goto(url,{waitUntil:'domcontentloaded'});await q.locator('#startButton').click();await ready(q);
  for(let i=0;i<step;i++){await q.locator('#prologueNext').click();await ready(q);}
  if(step===0){await q.locator('#prologueNext').click();await q.keyboard.press('Escape');}else await q.locator('#prologueSkip').click();
  await q.waitForFunction(()=>!AlchemyOpening.active&&AlchemyViewState.snapshot().phase==='idle');
  assert.equal(await q.evaluate(()=>AlchemyViewState.snapshot().current),'work');assert.equal(await q.evaluate(()=>AlchemyGame.snapshot().remaining),3);
  assert.equal(await q.evaluate(()=>AlchemyGame.snapshot().attempt),0);assert.equal(await q.locator('.game-layout').evaluate(el=>el.inert),false);await q.close();
 }
 console.log('PASS in-scene opening: actual room/counter/room, named first customer, three parcels, input lock, mid-story resume, direct loading, completed-story resume, skip during transition, mobile and reduced motion');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
