// Сквозной тест облачного сохранения: два «устройства» (браузера) + эмуляторы Auth и Firestore.
// Запуск: npm run test:e2e  (эмуляторы поднимает firebase emulators:exec)
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '../..');
const SDK_DIR = path.join(ROOT, 'node_modules/firebase');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.webmanifest': 'application/json' };
let server, base, browser;

test.before(async () => {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    if (p.endsWith('/')) p += 'index.html';
    const file = path.join(ROOT, p);
    if (!file.startsWith(ROOT) || !fs.existsSync(file)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/kotomatika/?emulator`;
  browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
});
test.after(async () => { await browser.close(); server.close(); });

// Устройство: отдельный контекст браузера со своим localStorage. SDK Firebase отдаём из npm (те же файлы, что на gstatic).
async function device({ cloud = true } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await ctx.route('https://www.gstatic.com/firebasejs/**', route => {
    if (!cloud) return route.abort();
    const name = new URL(route.request().url()).pathname.split('/').pop();
    route.fulfill({ path: path.join(SDK_DIR, name), contentType: 'text/javascript' });
  });
  await ctx.route('https://fonts.googleapis.com/**', r => r.abort());
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => window.Cloud && window.Cloud.status !== 'loading');
  return { ctx, page };
}

const signIn = (page, sub) => page.evaluate(s => window.Cloud.testSignIn(s, s + '@example.com'), sub);
const waitSynced = page => page.waitForFunction(() => window.Cloud.status === 'synced', null, { timeout: 20000 });

test('прогресс переезжает на новое устройство и сливается после игры офлайн', async () => {
  const fam = 'family-' + Date.now();
  const A = await device();
  await A.page.evaluate(() => {
    const p = Store.create('Маша', '1,2,3', 'gray');
    p.fish = 120; p.stars.w2 = 3; p.pets.push('puppy');
    Store.save();
  });
  await signIn(A.page, fam);
  await waitSynced(A.page);

  // Новое устройство: после входа родителя профиль появляется сам, код из картинок работает.
  const B = await device();
  await signIn(B.page, fam);
  await B.page.waitForFunction(() => Store.list().length === 1, null, { timeout: 20000 });
  const onB = await B.page.evaluate(() => { const p = Store.list()[0]; return { name: p.name, fish: p.fish, w2: p.stars.w2, pets: p.pets, pin: Store.checkPin(p, '1,2,3') }; });
  assert.deepEqual(onB, { name: 'Маша', fish: 120, w2: 3, pets: ['puppy'], pin: true });
  assert.ok(await B.page.$('.profiles-screen .profile-card'), 'экран «Кто играет?» показал профиль из облака');

  // A играет без сети, B играет онлайн.
  await A.ctx.setOffline(true);
  await A.page.evaluate(() => { const p = Store.list()[0]; p.stars.w4 = 2; p.achievements.boss1 = 1; Store.save(); });
  await B.page.evaluate(() => { const p = Store.list()[0]; p.xp = 999; p.stars.w3 = 1; p.fish = 5; Store.save(); window.Cloud.syncNow(); });
  await waitSynced(B.page);
  await A.ctx.setOffline(false);
  await A.page.evaluate(() => window.dispatchEvent(new Event('online')));

  // Оба устройства сходятся к одной версии, в которой есть всё сделанное на обоих.
  const want = p => p.stars.w2 === 3 && p.stars.w3 === 1 && p.stars.w4 === 2 && p.xp === 999 && !!p.achievements.boss1;
  for (const d of [A, B]) {
    await d.page.waitForFunction(fn => new Function('p', 'return ' + fn)(Store.list()[0]), want.toString().replace(/^p => /, ''), { timeout: 30000 });
  }
  const final = await Promise.all([A, B].map(d => d.page.evaluate(() => { const { updatedAt, ...r } = Store.list()[0]; return r; })));
  assert.deepEqual(final[0].stars, final[1].stars);
  assert.equal(final[0].xp, final[1].xp);

  // Резервная копия за сегодня создана.
  const snaps = await B.page.evaluate(id => window.Cloud.listSnapshots(id), final[1].id);
  assert.equal(snaps.length, 1);
  assert.equal(snaps[0].day, await B.page.evaluate(() => Store.todayStr()));

  // Удаление на одном устройстве убирает профиль и на другом.
  await A.page.evaluate(() => Store.remove(Store.list()[0].id));
  await B.page.waitForFunction(() => Store.list().length === 0, null, { timeout: 20000 });

  for (const d of [A, B]) { assert.deepEqual(d.page.errors, []); await d.ctx.close(); }
});

test('чужая семья не видит профили', async () => {
  const A = await device();
  await A.page.evaluate(() => { Store.create('Петя', '0,0,0', 'ginger'); });
  await signIn(A.page, 'owner-' + Date.now());
  await waitSynced(A.page);
  const C = await device();
  await signIn(C.page, 'stranger-' + Date.now());
  await waitSynced(C.page);
  await C.page.waitForTimeout(1500);
  assert.equal(await C.page.evaluate(() => Store.list().length), 0);
  await A.ctx.close(); await C.ctx.close();
});

test('без облака игра работает как раньше', async () => {
  const D = await device({ cloud: false });
  assert.equal(await D.page.evaluate(() => window.Cloud.status), 'unavailable');
  await D.page.click('[data-action=newProfile]');
  await D.page.fill('#nameInput', 'Оля');
  await D.page.click('[data-action=draftNext]');
  for (const i of [1, 2, 3]) await D.page.click(`[data-action=draftPin][data-i="${i}"]`);
  await D.page.click('[data-action=draftCreate]');
  await D.page.waitForSelector('.screen.hub');
  assert.deepEqual(D.page.errors, []);
  await D.ctx.close();
});
