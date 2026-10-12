// Скриншоты родительского уголка (не тест, для ручной проверки): node tests/e2e/screens.shot.js <папка> под эмуляторами
'use strict';
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '../..'), OUT = process.argv[2];
(async () => {
  const server = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p); if (!fs.existsSync(f)) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' }[path.extname(f)] || 'application/octet-stream' });
    fs.createReadStream(f).pipe(res);
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('https://www.gstatic.com/firebasejs/**', r => r.fulfill({ path: path.join(ROOT, 'node_modules/firebase', new URL(r.request().url()).pathname.split('/').pop()), contentType: 'text/javascript' }));
  const p = await ctx.newPage();
  await p.goto(`http://127.0.0.1:${server.address().port}/kotomatika/?emulator`);
  await p.waitForFunction(() => window.Cloud.status !== 'loading');
  await p.screenshot({ path: OUT + '/p1-profiles.png' });
  await p.evaluate(() => { const x = Store.create('Маша', '1,2,3', 'gray'); x.fish = 340; x.stars.w2 = 3; Store.save(); Store.create('Маша', '0,0,0', 'ginger'); });
  await p.click('[data-action=parent]');
  await p.screenshot({ path: OUT + '/p2-gate.png' });
  const ans = await p.evaluate(() => parentGate.answer);
  await p.fill('#gateInput', String(ans)); await p.click('[data-action=parentGateOk]');
  await p.waitForTimeout(300);
  await p.screenshot({ path: OUT + '/p3-signedout.png', fullPage: true });
  await p.evaluate(() => window.Cloud.testSignIn('shots-' + Date.now(), 'mama@example.com'));
  await p.waitForFunction(() => window.Cloud.status === 'synced', null, { timeout: 20000 });
  await p.waitForTimeout(500);
  await p.screenshot({ path: OUT + '/p4-signedin.png', fullPage: true });
  await p.click('[data-action=cloudSnapshots]');
  await p.waitForSelector('.snapshot-row');
  await p.screenshot({ path: OUT + '/p5-snapshots.png' });
  await p.click('[data-action=closeModal]');
  await p.click('[data-action=mergeDup]');
  await p.waitForTimeout(800);
  await p.screenshot({ path: OUT + '/p6-merged.png', fullPage: true });
  await p.click('[data-action=parentBack]');
  await p.click('[data-action=pickProfile]');
  for (const i of [1, 2, 3]) await p.click(`[data-action=pinTap][data-i="${i}"]`);
  await p.waitForTimeout(600);
  await p.screenshot({ path: OUT + '/p7-hub.png' });
  await b.close(); server.close();
})();
