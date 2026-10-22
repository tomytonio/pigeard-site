// Mesure de fluidité d'une page : chargement (écran de chargement compris), puis
// défilement continu, CPU ralenti pour imiter un téléphone de milieu de gamme.
//
// Usage (serveur local lancé à la racine : python3 -m http.server 8765) :
//   node tools/mesure-fluidite.mjs index.html mobile      # ou desktop
//   BASE=http://localhost:8767/ node tools/mesure-fluidite.mjs index.html mobile   # autre version
// Options : 3e argument = ralentissement CPU (défaut 4), 4e = nombre d'essais (défaut 3).
//
// Résultat : images/s pendant le défilement, nombre d'images > 33 ms et > 50 ms
// (saccades visibles), temps de script / style / mise en page. Les appels n8n sont
// simulés (avis et compteur arrivent après ~2 s, comme en production).
// Attention : Chromium tourne ici sans carte graphique ; le coût des effets (flous,
// fusions) est exagéré, les chiffres servent à comparer deux versions entre elles.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const page_ = process.argv[2] || 'index.html';
const mode = process.argv[3] || 'mobile';
const cpu = +(process.argv[4] || 4);
const essais = +(process.argv[5] || 3);
const BASE = process.env.BASE || 'http://localhost:8765/';

const AVIS = { note_moyenne: '4,9', total: 312, avis: Array.from({ length: 6 }, (_, i) => ({
  note: 5, commentaire: 'Accueil chaleureux, conseils précis et lunettes parfaitement ajustées ' + i,
  auteur: 'Client ' + i, magasin: ['Nogent-le-Rotrou', 'Brou', 'La Loupe'][i % 3] })) };

const SONDE = `(function(){
  window.__m = { images: [], finLoader: null, vuLoader: false };
  (function raf(t){ __m.images.push(t); requestAnimationFrame(raf); })(0);
  (function guette(){
    var c = document.documentElement && document.documentElement.classList.contains('pg-loading');
    if(c) __m.vuLoader = true; else if(__m.vuLoader && __m.finLoader == null) __m.finLoader = performance.now();
    if(__m.finLoader == null) setTimeout(guette, 10);
  })();
})();`;

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const res = [];
for (let r = 0; r < essais; r++) {
  const ctx = await browser.newContext(mode === 'mobile'
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  await ctx.route(/n8n-1zv1/, async route => {
    const u = route.request().url(), h = { 'access-control-allow-origin': '*' };
    if (u.includes('avis-site')) { await new Promise(x => setTimeout(x, 2200)); return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(AVIS) }); }
    if (u.includes('visites-site')) { await new Promise(x => setTimeout(x, 1900)); return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: '{"count":12345}' }); }
    return route.fulfill({ status: 200, headers: h, body: 'ok' });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await cdp.send('Performance.enable');
  await page.addInitScript(SONDE);
  await page.goto(BASE + page_, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__m && (window.__m.finLoader != null || (!window.__m.vuLoader && performance.now() > 4000)), null, { timeout: 15000 }).catch(() => {});
  const m0 = await cdp.send('Performance.getMetrics');
  const t0 = await page.evaluate(() => performance.now());
  for (let i = 0; i < 4; i++) {
    await cdp.send('Input.synthesizeScrollGesture', { x: mode === 'mobile' ? 200 : 700, y: mode === 'mobile' ? 600 : 500,
      yDistance: -1400, speed: 1100, gestureSourceType: mode === 'mobile' ? 'touch' : 'mouse' });
  }
  await page.waitForTimeout(800);
  const t1 = await page.evaluate(() => performance.now());
  const m1 = await cdp.send('Performance.getMetrics');
  const d = await page.evaluate(([a, b]) => {
    const f = __m.images.filter(t => t >= a && t <= b), d = [];
    for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    return d;
  }, [t0, t1]);
  const met = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
  const delta = k => Math.round((met(m1, k) - met(m0, k)) * 1000);
  res.push({ 'img/s': +(d.length / ((t1 - t0) / 1000)).toFixed(1), '>33ms': d.filter(x => x > 34).length, '>50ms': d.filter(x => x > 50).length,
    'pire (ms)': Math.round(Math.max(...d)), 'script': delta('ScriptDuration'), 'style': delta('RecalcStyleDuration'), 'mise en page': delta('LayoutDuration') });
  await ctx.close();
}
await browser.close();
console.log(`${page_} — ${mode} — CPU ×${cpu}`);
console.table(res);
