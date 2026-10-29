const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const out=path.resolve(__dirname,'../../Evidence/EquipmentDrawerV09');fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await page.locator('#startButton').click();
 const skip=page.getByRole('button',{name:'跳过演出',exact:true});if(await skip.isVisible())await skip.click();
 // Isolated test profile: grant owned equipment to exercise existing-player UI.
 await page.evaluate(()=>{const saved=JSON.parse(localStorage.getItem('alchemy-days-v1'));saved.campaign.economy.coins=5000;saved.campaign.economy.tools=['needle','burn','return','ash','guide_red','guide_blue'];saved.campaign.economy.equipped=['needle','burn'];localStorage.setItem('alchemy-days-v1',JSON.stringify(saved));});
 await page.reload();await page.locator('#startButton').click();if(await skip.isVisible())await skip.click();
 const drawer=page.locator('#equipmentDrawer');
 await page.locator('.equipped-tool-status').click();await drawer.waitFor({state:'visible'});
 await drawer.locator('.equipment-card [data-equipment="return"]').click();assert.equal(await page.evaluate(()=>AlchemyGame.campaign().economy.equipped.length),3);
 assert.equal(await drawer.locator('.equipment-card [data-equipment="ash"]').isDisabled(),true);
 await drawer.locator('.equipment-slot[data-equipment="return"]').click();assert.equal(await page.evaluate(()=>AlchemyGame.campaign().economy.equipped.length),2);
 await drawer.locator('.equipment-card [data-equipment="guide_red"]').click();assert.equal(await drawer.locator('.equipment-card [data-equipment="guide_blue"]').isDisabled(),true);
 await page.keyboard.press('Escape');assert.equal(await drawer.isVisible(),false);assert.equal(await page.locator('.equipped-tool-status').getAttribute('aria-expanded'),'false');
 await page.locator('#herbObject').click();await page.locator('#fireObject').click();await page.waitForFunction(()=>!AlchemyGame.snapshot().pillEnded);
 await page.locator('.equipped-tool-status').click();await drawer.waitFor({state:'visible'});assert.match(await drawer.locator('.equipment-state').textContent(),/配装已锁定/);assert.equal(await drawer.locator('.equipment-slot.filled').first().isDisabled(),true);
 await drawer.locator('[data-close-equipment]').click();await page.locator('#trayObject').click();await page.waitForFunction(()=>AlchemyGame.snapshot().pillEnded);
 const reports=[];
 for(const size of [{width:1440,height:900},{width:1024,height:768},{width:390,height:844}]){
  await page.setViewportSize(size);await page.locator('.equipped-tool-status').click();await drawer.waitFor({state:'visible'});await page.waitForTimeout(250);
  const geometry=await page.evaluate(()=>{const rect=n=>{const r=n.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom};};return {drawer:rect(document.querySelector('#equipmentDrawer')),forge:rect(document.querySelector('.forge-panel')),viewport:rect(document.querySelector('.engine-viewport')),scroll:document.documentElement.scrollHeight>innerHeight,forgeInert:document.querySelector('.engine-viewport').inert,shade:!!document.querySelector('.engine-shade')};});
  assert.equal(geometry.scroll,false);assert.equal(geometry.forgeInert,false);assert.equal(geometry.shade,false);assert.ok(geometry.drawer.x>=0&&geometry.drawer.right<=size.width+1);assert.ok(geometry.drawer.bottom<=size.height+1);
  assert.ok(geometry.forge.right<=geometry.drawer.x+1||geometry.forge.bottom<=geometry.drawer.y+1,'drawer does not cover scaled forge');
  await page.screenshot({path:path.join(out,`equipment-${size.width}.png`)});reports.push({size,...geometry});
  await drawer.locator('[data-close-equipment]').click();assert.equal(await drawer.isVisible(),false);
 }
 await page.locator('[data-view="shop"]').click();assert.equal(await drawer.isVisible(),false);assert.equal(await page.locator('.economy-board [data-kind="equip"]').count(),0);await page.locator('[data-open-equipment]').click();assert.equal(await drawer.isVisible(),true);assert.equal(await page.locator('.economy-board').isVisible(),false);
 assert.deepEqual(errors,[]);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({browser:'headless Microsoft Edge',checks:'real UI equip/unequip/full slots/direction conflict/live furnace lock/collect/Escape/market navigation/responsive bounds',reports,errors},null,2));
 console.log('PASS: real Edge interactions, live furnace lock and non-overlapping drawer at 1440x900, 1024x768, 390x844');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
