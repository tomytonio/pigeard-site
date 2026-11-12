// Mesure de fluidité d'une page : chargement (écran de chargement compris), puis
// défilement continu — ou page immobile —, CPU ralenti pour imiter un téléphone de
// milieu de gamme.
//
// Usage (serveur local lancé à la racine : python3 -m http.server 8765) :
//   node tools/mesure-fluidite.mjs index.html mobile      # ou desktop
//   BASE=http://localhost:8767/ node tools/mesure-fluidite.mjs index.html mobile   # autre version
//   REPOS=6000 node tools/mesure-fluidite.mjs index.html mobile   # page immobile à 6000 px du haut, 5 s
//   Q='?noel=0' node tools/mesure-fluidite.mjs index.html mobile  # sans le décor des fêtes
// Options : 3e argument = ralentissement CPU (défaut 4), 4e = nombre d'essais (défaut 3).
//
// Résultat : distance réellement défilée, images/s, nombre d'images > 33 ms et > 50 ms
// (saccades visibles), temps de calcul du fil principal par seconde (« occupé », sur
// 1000 ms), dont script / style / mise en page. Les appels n8n sont simulés (avis et
// compteur arrivent après ~2 s, comme en production).
//
// Mode mobile : le défilement est produit par de vrais événements tactiles (doigt posé,
// déplacé, levé — 8 glissements). Le geste tactile « tout fait » de Chromium
// (Input.synthesizeScrollGesture) ne fait plus défiler la page depuis Chromium 153
// (constaté le 2026-11-12, y compris sur une page vide) : l'outil mesurait alors une
// page immobile. La colonne « défilé (px) » permet de le vérifier à chaque mesure.
//
// Attention : Chromium tourne ici sans carte graphique ; le coût des effets (flous,
// fusions, canvas) est exagéré, les chiffres servent à comparer deux versions entre elles.
import { createRequire } from 'module';
const require = createRequire('/opt/node22/lib/node_modules/');
const { chromium } = require('playwright');

const page_ = process.argv[2] || 'index.html';
const mode = process.argv[3] || 'mobile';
const cpu = +(process.argv[4] || 4);
const essais = +(process.argv[5] || 3);
const BASE = process.env.BASE || 'http://localhost:8765/';
const Q = process.env.Q || '';
const REPOS = process.env.REPOS; // position (px) où mesurer la page immobile
const pause = ms => new Promise(r => setTimeout(r, ms));

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

/* un glissement du doigt de bas en haut (620 px à ~1100 px/s), comme un pouce sur l'écran */
async function glisser(cdp) {
  const x = 200, y0 = 740, y1 = 120, n = Math.round(((y0 - y1) / 1100) * 1000 / 16);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] });
  const t0 = Date.now();
  for (let i = 1; i <= n; i++) {
    const attente = t0 + i * 16 - Date.now();
    if (attente > 0) await pause(attente);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - (y0 - y1) * i / n }] });
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await pause(140);
}

const browser = await chromium.launch();
const res = [];
for (let r = 0; r < essais; r++) {
  const ctx = await browser.newContext(mode === 'mobile'
    ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true }
    : { viewport: { width: 1440, height: 900 } });
  await ctx.route(/n8n-1zv1/, async route => {
    const u = route.request().url(), h = { 'access-control-allow-origin': '*' };
    if (u.includes('avis-site')) { await pause(2200); return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: JSON.stringify(AVIS) }); }
    if (u.includes('visites-site')) { await pause(1900); return route.fulfill({ status: 200, contentType: 'application/json', headers: h, body: '{"count":12345}' }); }
    return route.fulfill({ status: 200, headers: h, body: 'ok' });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  await cdp.send('Performance.enable');
  await page.addInitScript(SONDE);
  await page.goto(BASE + page_ + Q, { waitUntil: 'commit' });
  await page.waitForFunction(() => window.__m && (window.__m.finLoader != null || (!window.__m.vuLoader && performance.now() > 4000)), null, { timeout: 15000, polling: 100 }).catch(() => {});
  if (REPOS != null) { await page.evaluate(y => window.scrollTo(0, +y), REPOS); await pause(2500); }
  const m0 = await cdp.send('Performance.getMetrics');
  const [t0, y0] = await page.evaluate(() => [performance.now(), window.scrollY]);
  if (REPOS != null) await pause(5000);
  else if (mode === 'mobile') { for (let i = 0; i < 8; i++) await glisser(cdp); }
  else {
    for (let i = 0; i < 4; i++) {
      await cdp.send('Input.synthesizeScrollGesture', { x: 700, y: 500, yDistance: -1400, speed: 1100, gestureSourceType: 'mouse' });
    }
  }
  if (REPOS == null) await page.waitForTimeout(800);
  const [t1, y1] = await page.evaluate(() => [performance.now(), window.scrollY]);
  const m1 = await cdp.send('Performance.getMetrics');
  const d = await page.evaluate(([a, b]) => {
    const f = __m.images.filter(t => t >= a && t <= b), d = [];
    for (let i = 1; i < f.length; i++) d.push(f[i] - f[i - 1]);
    return d;
  }, [t0, t1]);
  const met = (m, k) => (m.metrics.find(x => x.name === k) || {}).value || 0;
  const duree = (t1 - t0) / 1000;
  const parSeconde = k => Math.round((met(m1, k) - met(m0, k)) * 1000 / duree);
  res.push({ 'défilé (px)': Math.round(y1 - y0), 'img/s': +(d.length / duree).toFixed(1), '>33ms': d.filter(x => x > 34).length, '>50ms': d.filter(x => x > 50).length,
    'pire (ms)': Math.round(Math.max(...d)), 'occupé (ms/s)': parSeconde('TaskDuration'), 'script': parSeconde('ScriptDuration'), 'style': parSeconde('RecalcStyleDuration'), 'mise en page': parSeconde('LayoutDuration') });
  await ctx.close();
}
await browser.close();
console.log(`${page_}${Q} — ${mode} — CPU ×${cpu} — ${REPOS != null ? 'page immobile à ' + REPOS + ' px' : 'défilement'}`);
console.table(res);
if (REPOS == null && res.some(x => x['défilé (px)'] < 1000)) console.log('⚠ La page n\'a presque pas défilé : mesure non valable (voir l\'en-tête de ce fichier).');
