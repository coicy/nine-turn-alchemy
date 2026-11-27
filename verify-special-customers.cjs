const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const http = require('node:http');

const Catalog = require('./customer-catalog.js');
globalThis.AlchemyCustomerCatalog = Catalog;
const Crafts = require('./crafts.js');
globalThis.AlchemyCrafts = Crafts;
const Economy = require('./economy.js');
globalThis.AlchemyEconomy = Economy;
const Customers = require('./customers.js');
globalThis.AlchemyCustomers = Customers;
const Campaign = require('./campaign.js');
globalThis.AlchemyCampaign = Campaign;
const DialogueEngine = require('./dialogue-core.js');

// 1. Validate customer catalog & dialogue graph
assert.deepEqual(Customers.validate(), [], 'Customer catalog must pass validation');
const dlgCtx = { window: {} };
vm.createContext(dlgCtx);
vm.runInContext(fs.readFileSync(path.join(__dirname, 'dialogue-content.js'), 'utf8'), dlgCtx);
assert.deepEqual(DialogueEngine.validate(dlgCtx.window.AlchemyDialogueContent), [], 'Dialogue graphs including special_commission must pass validation');

// 2. Verify Days 1-3 remain pure ordinary orders, and Days 4-30 schedule special multi-visit arcs
const c = Campaign.create();
Economy.ensure(c);
for (let d = 1; d <= 3; d++) {
  assert.equal(c.orders.some(o => o.arcId || o.specialNoteId), false, `Day ${d} must have no special arc overrides`);
  Campaign.settle(c);
  Campaign.next(c);
}

// Day 4: Hua Mantang Stage 1 + Random Note 1 (Song Qingyuan)
assert.equal(c.day, 4);
const d4ArcOrders = c.orders.filter(o => o.arcId);
assert.equal(d4ArcOrders.length, 1, 'At most 1 special multi-visit order per day');
assert.equal(d4ArcOrders[0].arcId, 'special-hua');
assert.equal(d4ArcOrders[0].arcStage, 1);
assert.match(Customers.letterBody(d4ArcOrders[0]), /礼部禁演苦戏/);
const d4NoteOrder = c.orders.find(o => o.specialNoteId);
assert.equal(d4NoteOrder?.specialNoteId, 'note-song');
assert.match(d4NoteOrder.name, /贺瑞丹疏/);
assert.match(Customers.letterBody(d4NoteOrder), /恭贺圣寿无疆/);

// Complete Hua Mantang Stage 1 with an unscarred pill -> verify trait match bonus (+16)
assert.equal(Campaign.accept(c, d4ArcOrders[0].id), true);
const coinsBefore = c.economy.coins;
const baseFee = Economy.fee(d4ArcOrders[0]);
Campaign.resolve(c, d4ArcOrders[0].target, 1);
Economy.commission(c, d4ArcOrders[0], [{ id: 'p1', value: d4ArcOrders[0].target, turn: 6, scars: 0, nature: 'warm' }]);
assert.equal(d4ArcOrders[0].specialMatched, true, 'Unscarred pill matches Hua Mantang trait preference');
assert.equal(d4ArcOrders[0].specialBonus, 16);
assert.equal(c.economy.coins, coinsBefore + baseFee + 16);
assert.match(Customers.line(d4ArcOrders[0]), /这丹火候极稳/);
assert.equal(c.specialChronicle.length, 1);

// Advance through Day 30, testing scarred match on Jiao Banxian, high-risk match on Bai Xiaoqi, failure branch on Cui Baojuan, and Act 4 postscripts
while (c.day < 30) {
  Campaign.settle(c);
  Campaign.next(c);
  const special = c.orders.find(o => o.arcId);
  if (special) {
    if (special.arcId === 'special-cui' && special.arcStage === 1) {
      // Intentionally fail Cui Stage 1 to test prevFailed branch in Stage 2
      Campaign.accept(c, special.id);
      Campaign.resolve(c, 0, 1, true);
    } else {
      if (special.arcId === 'special-cui' && special.arcStage === 2) {
        assert.equal(special.arcPrevOutcome, 'failed', 'Cui Stage 2 must remember Stage 1 failure');
        assert.match(Customers.letterBody(special), /灌了烧刀子/);
      }
      Campaign.accept(c, special.id);
      Campaign.resolve(c, special.target + 30, 1);
      const pill = {
        id: 'p-' + c.day,
        value: special.target + 30,
        turn: 8,
        scars: special.arcId === 'special-jiao' && special.arcStage !== 2 ? 2 : 0,
        riskPeak: special.arcId === 'special-bai' ? 0.55 : 0.1,
        nature: special.arcId === 'special-qin' && special.arcStage === 3 ? 'cool' : 'warm'
      };
      Economy.commission(c, special, [pill]);
      assert.equal(special.specialMatched, true, `Special trait should match for ${special.arcId} stage ${special.arcStage}`);
    }
  }
  if (c.day === 28 || c.day === 29) {
    assert.equal(c.orders.some(o => ['special-hua', 'special-jiao', 'special-cui'].includes(o.arcId) && o.arcStage === 4), false, `Day ${c.day} must not trigger Act 4 state-mourning orders early`);
    assert.equal(c.specialPostscripts.some(p => ['special-jiao', 'special-cui'].includes(p.arcId)), false, `Day ${c.day} must not deliver Day 30 postscripts early`);
  }
}

assert.equal(c.day, 30);
assert.ok(c.orders.some(o => o.arcId === 'special-hua' && o.arcStage === 4), 'Day 30 schedules Hua Mantang Act 4 after state mourning');
assert.ok(c.specialPostscripts.length >= 4, 'Bai Xiaoqi, Qin Yuchan, Jiao Banxian, and Cui Baojuan deliver Act 4 postscripts by Day 30');
assert.ok(c.specialPostscripts.some(p => p.arcId === 'special-jiao'), 'Jiao Banxian Act 4 postscript arrives on Day 30');
assert.ok(c.specialPostscripts.some(p => p.arcId === 'special-cui'), 'Cui Baojuan Act 4 postscript arrives on Day 30');
const baiPost = c.specialPostscripts.find(p => p.arcId === 'special-bai');
assert.ok(baiPost);
const beforeClaim = c.economy.coins;
assert.equal(Economy.claimPostscript(c, baiPost.id), true);
assert.equal(c.economy.coins, beforeClaim + baiPost.bonusCoins);
assert.equal(Economy.claimPostscript(c, baiPost.id), false, 'Cannot double-claim postscript');

// 3. Verify 2026-11-27 copy & status-branch fixes
{
  const cui = Catalog.specialArcs['special-cui'].stages;
  assert.doesNotMatch(cui[1].letter, /顶缸契|赌徒/);
  assert.match(cui[1].pending, /顶缸契/);
  assert.doesNotMatch(cui[2].letter, /顶缸赌徒|独吞赏银/);
  assert.match(cui[2].pending, /独吞赏银/);
  assert.doesNotMatch(cui[3].prevCompleted, /半月前/);
  assert.doesNotMatch(cui[3].prevFailed, /半月前/);

  const bai = Catalog.specialArcs['special-bai'].stages;
  assert.doesNotMatch(bai[1].traitReaction, /差点炸炉/);
  assert.match(bai[2].pending, /过几日/);
  assert.doesNotMatch(bai[2].pending, /下个月/);
  assert.match(bai[3].prevCompleted, /这趟从省城回来/);
  assert.match(bai[3].prevFailed, /这趟从省城回来/);

  for (const note of Catalog.randomNotes) {
    assert.doesNotMatch(note.letter + note.completed, /低血糖/);
  }

  // Gao Quan: failed Act 1 (empty box) + completed Act 2 -> Act 3 uses receipt wording
  const gaoLine = Customers.line({ arcId: 'imperial-gao', arcStage: 3, arcPrevOutcome: 'completed', status: 'pending', materials: 3, target: 200 });
  assert.match(gaoLine, /回执都入了档/);
  assert.doesNotMatch(gaoLine, /前两回的丹都进了内廷档/);

  // Qin Stage 2 & Jiao Stage 1 distinguish skipped vs failed in specialChronicle
  const branchTest = Campaign.create();
  Economy.ensure(branchTest);
  branchTest.day = 14;
  branchTest.orders = [
    { id: 'D14-1', client: '侯府内眷', name: '彻夜亢奋丹', target: 150, materials: 3, status: 'pending', delivered: 0, used: 0, returned: 0, arcId: 'special-qin', arcStage: 2 },
    { id: 'D14-2', client: '奇石造假客', name: '铜鹤做旧胚', target: 150, materials: 3, status: 'pending', delivered: 0, used: 0, returned: 0, arcId: 'special-jiao', arcStage: 1 }
  ];
  Campaign.accept(branchTest, 'D14-1');
  Campaign.resolve(branchTest, 0, 1, true);
  Campaign.settle(branchTest);
  assert.match(branchTest.specialChronicle[0].text, /未能如期交丹/);
  assert.match(branchTest.specialChronicle[1].text, /本坊未接/);

  const branchTest2 = Campaign.create();
  Economy.ensure(branchTest2);
  branchTest2.day = 14;
  branchTest2.orders = [
    { id: 'D14-1', client: '侯府内眷', name: '彻夜亢奋丹', target: 150, materials: 3, status: 'pending', delivered: 0, used: 0, returned: 0, arcId: 'special-qin', arcStage: 2 },
    { id: 'D14-2', client: '奇石造假客', name: '铜鹤做旧胚', target: 150, materials: 3, status: 'pending', delivered: 0, used: 0, returned: 0, arcId: 'special-jiao', arcStage: 1 }
  ];
  Campaign.accept(branchTest2, 'D14-2');
  Campaign.resolve(branchTest2, 0, 1, true);
  Campaign.settle(branchTest2);
  const jiaoFail = branchTest2.specialChronicle.find(x => x.arcId === 'special-jiao');
  const qinSkip = branchTest2.specialChronicle.find(x => x.arcId === 'special-qin');
  assert.equal(jiaoFail?.status, 'failed');
  assert.match(jiaoFail.text, /未能如期交丹/);
  assert.equal(qinSkip?.status, 'skipped');
  assert.match(qinSkip.text, /本坊未接此单/);
}

console.log('PASS unit & 30-day simulation: catalog, dialogue graph, 4-act scheduler, trait match bonus, failure branch memory, Act 4 postscripts, and random background notes.');

if (process.argv.includes('--browser')) {
  const { chromium } = require('playwright');
  const outDir = path.resolve(__dirname, '../../Evidence/SpecialCustomers20261125');
  fs.mkdirSync(outDir, { recursive: true });
  const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
  const server = http.createServer((req, res) => {
    try {
      const f = path.resolve(__dirname, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname));
      if (!f.startsWith(__dirname + path.sep)) throw Error();
      const data = fs.readFileSync(f);
      res.writeHead(200, { 'Content-Type': mime[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  (async () => {
    await new Promise(r => server.listen(0, '127.0.0.1', r));
    const base = 'http://127.0.0.1:' + server.address().port;
    const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--disable-gpu'] });
    try {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      await page.goto(base + '/index.html');
      await page.locator('#mainMenuPrimary').click();
      await page.locator('#gameDialogue').waitFor({ state: 'visible' });
      await page.locator('#dialogueLeave').click();
      await page.locator('#dialogueConfirmSkip').click();
      await page.waitForFunction(() => AlchemyGame.snapshot().started && AlchemyViewState.snapshot().phase === 'idle' && !AlchemyOpening.active);

      await page.evaluate(() => {
        const api = window.AlchemyGame;
        api.abandonOrder();
        for (let d = 1; d < 4; d++) {
          api.endDay();
          api.nextDay();
        }
        if (window.AlchemyMerchantVisit?.atCounter) api.merchantAction('dismiss');
        window.AlchemyViewState.navigate('orders');
      });
      await page.waitForFunction(() => AlchemyViewState.snapshot().current === 'orders' && AlchemyViewState.snapshot().phase === 'idle');
      await page.waitForTimeout(300);
      const debugInfo = await page.evaluate(() => ({
        day: AlchemyGame.campaign().day,
        firstOrder: AlchemyGame.campaign().orders[0],
        merchant: !!window.AlchemyMerchantVisit?.atCounter,
        visitorHtml: document.getElementById('counterVisitor')?.innerHTML?.slice(0, 200)
      }));
      console.log('Browser Day 4 state:', JSON.stringify(debugInfo));

      assert.match(await page.locator('#counterVisitor .visitor-portrait').getAttribute('aria-label'), /花满堂/);
      await page.locator('#counterConversation').click();
      await page.locator('#gameDialogue').waitFor({ state: 'visible' });
      await page.locator('#dialogueAdvance').click();
      assert.match(await page.locator('#dialogueText').textContent(), /红蟒戏服/);
      await page.screenshot({ path: path.join(outDir, '01-special-dialogue.png') });
      await page.locator('#dialogueNext').click();
      await page.locator('#dialogueAdvance').click();
      await page.locator('#dialogueNext').click();
      await page.waitForTimeout(300);

      assert.match(await page.locator('#counterLetter').textContent(), /特殊来客 · 第1访/);
      await page.screenshot({ path: path.join(outDir, '02-special-letter.png') });

      await page.evaluate(() => window.AlchemyViewState.navigate('record', { chapter: 'chronicle' }));
      await page.waitForFunction(() => AlchemyViewState.snapshot().current === 'record' && AlchemyViewState.snapshot().phase === 'idle');
      await page.waitForTimeout(250);
      assert.match(await page.locator('.ledger-chronicle').textContent(), /昏君当道 · 坊间来客录/);
      await page.screenshot({ path: path.join(outDir, '03-journal-chronicle.png') });
      assert.deepEqual(errors, []);
      console.log('PASS browser screenshots & UI check');
    } finally {
      await browser.close();
      server.close();
    }
  })().catch(e => {
    console.error(e);
    server.close();
    process.exitCode = 1;
  });
}
