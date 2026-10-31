const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(process.env.ALCHEMY_TEST_URL||pathToFileURL(path.join(__dirname,'index.html')).href,{waitUntil:'domcontentloaded'});
 const start=async()=>{await p.locator('#startButton').click();await p.locator('#prologueSkip').click();};
 const open=async()=>{await p.locator('.engine-nav .save-open').click();await p.locator('#savePicker').waitFor({state:'visible'});};
 const pick=async id=>{await Promise.all([p.waitForEvent('load'),p.locator(`[data-slot="${id}"]`).click()]);};
 await start();await p.locator('.onboarding-expand').click();
 await p.evaluate(()=>{AlchemyGame.abandonOrder();AlchemyGame.endDay();AlchemyGame.nextDay();AlchemyGame.chooseOrder('D2-1');AlchemyGame.economyAction('material',0);AlchemyGame.load();});
 const one=await p.evaluate(()=>localStorage.getItem('alchemy-slot-v1-1'));
 await open();assert.match(await p.locator('.save-slot').first().innerText(),/第 2 天/);
 await pick(2);assert.doesNotMatch(await p.locator('#startButton').innerText(),/继续/);
 await p.locator('#startButton').click();assert.match(await p.locator('#prologueStep').innerText(),/1 \/ 3/);await p.locator('#prologueSkip').click();
 assert.equal(await p.evaluate(()=>AlchemySaves.active),2);assert.equal(await p.evaluate(()=>AlchemyGame.campaign().day),1);
 assert.equal(await p.locator('[data-view="equipment"]').isVisible(),false);
 assert.equal(await p.evaluate(()=>localStorage.getItem('alchemy-slot-v1-1')),one);
 await open();await pick(1);assert.match(await p.locator('#startButton').innerText(),/继续/);await p.locator('#startButton').click();
 assert.equal(await p.evaluate(()=>AlchemyGame.campaign().day),2);assert.equal(await p.evaluate(()=>AlchemyGame.snapshot().pillEnded),false);assert.equal(await p.evaluate(()=>AlchemyGame.campaign().economy.stock[0]),1);
 assert.equal(await p.locator('[data-view="equipment"]').isVisible(),true);
 await p.evaluate(()=>AlchemyGame.refine());assert.equal(await p.locator('.engine-nav .save-open').isDisabled(),true);await p.waitForFunction(()=>!AlchemyGame.snapshot().busy);
 await open();await p.locator('[data-reset="2"]').click();assert.ok(await p.locator('[data-reset="2"]').innerText().then(t=>t.includes('确认清空')));
 await p.locator('[data-close]').click();assert.equal(await p.evaluate(()=>AlchemySaves.slot(2).data.campaign.day),1);
 await open();await p.locator('[data-reset="2"]').click();await Promise.all([p.waitForEvent('load'),p.locator('[data-reset="2"]').click()]);
 await start();assert.equal(await p.evaluate(()=>AlchemyGame.campaign().economy.coins),80);assert.equal(await p.locator('[data-view="equipment"]').isVisible(),false);
 assert.equal(await p.evaluate(()=>AlchemySaves.slot(1).data.campaign.day),2);
 await open();const out=path.resolve(__dirname,'../../Evidence/SaveSlotsV01');fs.mkdirSync(out,{recursive:true});
 for(const width of [1440,390]){await p.setViewportSize({width,height:900});assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:path.join(out,'slots-'+width+'.png')});}
 await p.locator('[data-close]').click();
 // Migration uses a genuine game snapshot and preserves the original save bytes.
 const old=await p.evaluate(()=>JSON.stringify(AlchemySaves.slot(1).data));
 await p.evaluate(old=>{localStorage.clear();localStorage.setItem('alchemy-days-v1',old);localStorage.setItem('alchemy-onboarding-expanded-v53','true');},old);
 await p.reload();await p.locator('#startButton').click();assert.equal(await p.evaluate(()=>AlchemyGame.campaign().day),2);assert.equal(await p.evaluate(()=>localStorage.getItem('alchemy-days-v1')),old);
 assert.deepEqual(errors,[]);console.log('PASS browser slots: preserve live day-2 progress, fresh three-scene opening, isolated guidance, restore, reset confirmation, desktop/mobile picker and legacy migration; no page errors');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
