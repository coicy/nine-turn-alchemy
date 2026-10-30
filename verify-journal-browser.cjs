const {chromium}=require('playwright'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),{pathToFileURL}=require('node:url');
(async()=>{const b=await chromium.launch({channel:'msedge',headless:true});try{
 const p=await b.newPage({viewport:{width:1440,height:900}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(pathToFileURL(path.join(__dirname,'index.html')).href);await p.locator('#startButton').click();await p.locator('#prologueSkip').click();await p.waitForTimeout(750);
 const out=path.resolve(__dirname,'../../Evidence/JournalV43');fs.mkdirSync(out,{recursive:true});
 await p.locator('.scene-loadout').click();assert.equal(await p.locator('#equipmentDrawer').isVisible(),true);await p.locator('[data-close-equipment]').click();
 await p.locator('[data-view=record]').click();assert.equal(await p.locator('#trialTitle').isVisible(),true);assert.equal(await p.locator('.forge-panel').isVisible(),false);
 await p.getByRole('button',{name:'经营收支',exact:true}).click();assert.equal(await p.locator('#trialTitle').isVisible(),false);assert.match(await p.locator('.ledger-totals').textContent(),/80 铜钱/);await p.screenshot({path:path.join(out,'ledger.png')});
 await p.locator('[data-view=manual]').click();assert.equal(await p.locator('.fusion-entry:visible').count(),6);assert.equal(await p.locator('#telemetryEnabled').isVisible(),false);await p.screenshot({path:path.join(out,'manual.png')});
 await p.getByRole('button',{name:'最近炉讯',exact:true}).click();assert.equal(await p.locator('#logList').isVisible(),true);assert.equal(await p.locator('.fusion-entry:visible').count(),0);
 await p.getByRole('button',{name:'试玩记录',exact:true}).click();assert.equal(await p.locator('#telemetryEnabled').isVisible(),true);assert.equal(await p.locator('#telemetryEnabled').isChecked(),false);
 await p.evaluate(()=>{AlchemyEconomy.TOOL_DEFS.find(t=>t.id==='needle').price=1;AlchemyEconomy.TOOLS.needle=1;AlchemyGame.economyAction('tool','needle');AlchemyGame.economyAction('equip','needle');});
 await p.locator('[data-view=work]').click();assert.equal(await p.locator('.scene-loadout .tool-art').count(),1);assert.match(await p.locator('.scene-loadout').textContent(),/生纹针/);await p.screenshot({path:path.join(out,'rack.png')});
 await p.evaluate(()=>AlchemyGame.load());await p.waitForTimeout(200);assert.match(await p.locator('.scene-loadout').textContent(),/本炉已锁定/);
 for(const size of [{width:1024,height:768},{width:390,height:844}]){await p.setViewportSize(size);await p.locator('[data-view=manual]').click();await p.getByRole('button',{name:'丹纹图录',exact:true}).click();const bounds=await p.locator('.journal-book.side-panel').boundingBox();assert(bounds.x>=0&&bounds.x+bounds.width<=size.width);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.screenshot({path:path.join(out,'manual-'+size.width+'.png')});}
 assert.deepEqual(errors,[]);console.log('PASS journal chapters, live finances, six rune effects, opt-in retained, equipped sprites, furnace lock and 3 viewport sizes');
 }finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
