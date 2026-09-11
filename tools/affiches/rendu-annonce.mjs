// Rend une annonce presse HTML en JPEG à la taille exacte demandée (mm + dpi).
// Usage : node rendu-annonce.mjs <fichier.html> <sortie.jpg> [largeur_mm] [hauteur_mm] [dpi] [qualité]
// Défaut : 195 × 245 mm à 300 dpi → 2303 × 2894 px (format pleine page magazine).
// Le HTML doit être écrit en millimètres (le viewport est calé sur 96 dpi CSS).
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const [, , htmlPath, jpgPath, mmL = 195, mmH = 245, dpi = 300, qualite = 96] = process.argv;
const cssL = Math.round((Number(mmL) / 25.4) * 96);
const cssH = Math.round((Number(mmH) / 25.4) * 96);

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: cssL, height: cssH },
  deviceScaleFactor: Number(dpi) / 96,
});
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);
let buf = await page.screenshot({ type: 'jpeg', quality: Number(qualite) });
await browser.close();

// Inscrit la résolution dans l'en-tête JFIF : l'imprimeur lit 300 dpi, pas 96.
if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff && buf[3] === 0xe0
    && buf.toString('latin1', 6, 11) === 'JFIF\0') {
  buf[13] = 1; // unités = points par pouce
  buf.writeUInt16BE(Number(dpi), 14);
  buf.writeUInt16BE(Number(dpi), 16);
} else {
  console.warn('En-tête JFIF absent : résolution non inscrite.');
}
writeFileSync(resolve(jpgPath), buf);
console.log(`JPEG écrit : ${resolve(jpgPath)} — ${Math.round(cssL * dpi / 96)} × ${Math.round(cssH * dpi / 96)} px (${mmL} × ${mmH} mm à ${dpi} dpi)`);
