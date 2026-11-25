const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const {chromium} = require('playwright');

const root = path.resolve(__dirname);

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return ({
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
  })[ext] || 'application/octet-stream';
}

function startServer() {
  const server = http.createServer((request, response) => {
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
      const relative = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
      const file = path.resolve(root, relative);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403); response.end('Forbidden'); return;
      }
      const data = fs.readFileSync(file);
      response.writeHead(200, {'Content-Type': contentType(file), 'Cache-Control': 'no-store'});
      response.end(data);
    } catch (_) {
      response.writeHead(404); response.end('Not found');
    }
  });
  return new Promise(resolve => server.listen(0, '127.0.0.1', () => resolve(server)));
}

async function openEntry(browser, base, file, viewport) {
  const page = await browser.newPage({viewport});
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}/${file}`, {waitUntil: 'domcontentloaded'});
  await page.locator('#mainMenuPrimary').waitFor({state: 'visible'});
  await page.locator('#mainMenuPrimary').click();
  await page.waitForFunction(() => document.body.dataset.screen === 'playing');
  await page.locator('#gameDialogue').waitFor({state: 'visible'});
  await page.locator('#dialogueLeave').click();
  await page.locator('#dialogueConfirmSkip').click();
  await page.waitForFunction(() => !window.AlchemyOpening?.active);
  await page.waitForTimeout(250);
  return {page, errors};
}

async function stageSnapshot(page) {
  return page.evaluate(() => {
    const stage = document.getElementById('pillStage');
    const front = document.querySelector('.scene-front-mask');
    return {
      sceneImage: stage?.dataset.sceneImage || '',
      lidState: stage?.dataset.lidState || '',
      cameraCropped: stage?.dataset.cameraCropped || '',
      frontImage: getComputedStyle(front).backgroundImage,
      view: window.AlchemyViewState?.snapshot?.(),
      canvas: document.getElementById('alchemyScene')?.getBoundingClientRect().toJSON(),
      documentWidth: [document.documentElement.scrollWidth, document.documentElement.clientWidth],
    };
  });
}

async function enterFurnace(page) {
  await page.locator('.furnace-resume').waitFor({state: 'visible'});
  await page.locator('.furnace-resume').click();
  await page.waitForFunction(() => window.AlchemyViewState?.snapshot?.().workMode === 'furnace');
  await page.waitForTimeout(250);
}

async function verifyEntry(browser, base, file, expectedPrefix, outputDir, name) {
  const result = await openEntry(browser, base, file, {width: 1440, height: 900});
  const {page, errors} = result;
  try {
    const room = await stageSnapshot(page);
    assert.equal(room.sceneImage, `${expectedPrefix}room-desktop-open.webp`);
    assert.match(room.frontImage, new RegExp(`${expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}room-desktop-front\\.webp`));
    assert.equal(room.cameraCropped, 'false');
    assert.equal(room.view.workMode, 'room');
    await page.screenshot({path: path.join(outputDir, `${name}-room.png`), fullPage: false});

    await page.locator('.world-location-toggle').click();
    await page.locator('#worldLocationMenu [data-view="orders"]').click();
    await page.waitForFunction(() => window.AlchemyViewState?.snapshot?.().location === 'orders');
    assert.equal(await page.locator('.counter-board').isVisible(), true);
    assert.equal(await page.locator('.visitor-portrait').isVisible(), true);
    await page.screenshot({path: path.join(outputDir, `${name}-counter.png`), fullPage: false});

    await page.locator('.world-location-toggle').click();
    await page.locator('#worldLocationMenu [data-view="work"]').click();
    await page.waitForFunction(() => window.AlchemyViewState?.snapshot?.().location === 'work');
    await enterFurnace(page);
    const furnace = await stageSnapshot(page);
    assert.equal(furnace.sceneImage, `${expectedPrefix}furnace-desktop-open.webp`);
    assert.match(furnace.frontImage, new RegExp(`${expectedPrefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}furnace-desktop-front\\.webp`));
    assert.equal(furnace.cameraCropped, 'false');
    assert.equal(furnace.view.workMode, 'furnace');
    await page.screenshot({path: path.join(outputDir, `${name}-furnace.png`), fullPage: false});

    const anchors = await page.evaluate(() => {
      const canvas = document.getElementById('alchemyScene').getBoundingClientRect();
      const mouth = window.AlchemyWorldLayout.mouth;
      const fire = window.AlchemyWorldLayout.firebox;
      return {canvas, mouth, fire};
    });
    assert.ok(Number.isFinite(anchors.mouth.x) && Number.isFinite(anchors.mouth.y));
    assert.ok(Number.isFinite(anchors.fire.x) && Number.isFinite(anchors.fire.y));
    assert.ok(anchors.mouth.w > 0 && anchors.mouth.h > 0);
    assert.ok(anchors.fire.w > 0 && anchors.fire.h > 0);

    const slot = page.locator('.herb-slot[aria-disabled="false"]').first();
    await slot.waitFor({state: 'visible'});
    await slot.focus();
    await slot.press('Enter');
    await page.waitForFunction(() => window.AlchemyScene2D?.held === 'herbs');
    await page.locator('#alchemyScene').focus();
    await page.locator('#alchemyScene').press('Enter');
    await page.waitForFunction(() => window.AlchemyGame?.snapshot?.().pillEnded === false);
    await page.waitForTimeout(300);
    const live = await stageSnapshot(page);
    assert.equal(live.lidState, 'open');
    await page.screenshot({path: path.join(outputDir, `${name}-furnace-live.png`), fullPage: false});
    assert.deepEqual(errors, []);
    return {room, furnace, live, errors};
  } finally {
    await page.close();
  }
}

async function verifyMobile(browser, base, outputDir) {
  const {page, errors} = await openEntry(browser, base, 'index-warm-cinnabar.html', {width: 640, height: 860});
  try {
    const room = await stageSnapshot(page);
    assert.equal(room.sceneImage, 'assets/scene-illustrated/room-mobile-open.webp');
    assert.match(room.frontImage, /assets\/scene-illustrated\/room-mobile-front\.webp/);
    assert.equal(room.cameraCropped, 'false');
    assert.ok(room.documentWidth[0] <= room.documentWidth[1] + 2);
    await enterFurnace(page);
    const furnace = await stageSnapshot(page);
    assert.equal(furnace.sceneImage, 'assets/scene-illustrated/furnace-mobile-open.webp');
    assert.match(furnace.frontImage, /assets\/scene-illustrated\/furnace-mobile-front\.webp/);
    assert.equal(furnace.cameraCropped, 'false');
    assert.ok(furnace.documentWidth[0] <= furnace.documentWidth[1] + 2);
    await page.screenshot({path: path.join(outputDir, 'warm-mobile-furnace.png'), fullPage: false});
    assert.deepEqual(errors, []);
    return {room, furnace, errors};
  } finally {
    await page.close();
  }
}

(async () => {
  const outputDir = path.resolve(__dirname, '../../Evidence/ScenesV41');
  fs.mkdirSync(outputDir, {recursive: true});
  const server = await startServer();
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({channel: 'msedge', headless: true});
  try {
    await verifyEntry(browser, base, 'index.html', 'assets/scene-entry/warm-cinnabar/', outputDir, 'official');
    await verifyEntry(browser, base, 'index-warm-cinnabar.html', 'assets/scene-entry/warm-cinnabar/', outputDir, 'compat');
    await verifyMobile(browser, base, outputDir);
    console.log('PASS formal original assets, warm-cinnabar desktop room/furnace, interaction anchors, live lid state and 640px layout');
  } finally {
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
