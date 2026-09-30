// Rend un visuel HTML de taille libre en JPEG + WebP (pages du site).
// Usage : node rendu-visuel.mjs <fichier.html> <sortie-sans-extension> <largeur> <hauteur>
//   ex. : node rendu-visuel.mjs anne-et-valentin-01.html ../../assets/marques/visuels/anne-et-valentin-01 1600 1000
// Produit <sortie>.jpg (qualité 88, repli universel, og:image) et <sortie>.webp
// (qualité 86, encodé par Chromium via canvas : aucune dépendance en plus).
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { writeFileSync } from 'node:fs';

const [, , htmlPath, sortie, largeur, hauteur] = process.argv;
if (!htmlPath || !sortie || !largeur || !hauteur) {
  console.error('Usage : node rendu-visuel.mjs <fichier.html> <sortie-sans-extension> <largeur> <hauteur>');
  process.exit(1);
}
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: +largeur, height: +hauteur },
  deviceScaleFactor: 1,
});
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(300);

const jpg = resolve(sortie + '.jpg');
await page.screenshot({ path: jpg, type: 'jpeg', quality: 88 });

const png = await page.screenshot({ type: 'png' });
const webpBase64 = await page.evaluate(async (src) => {
  const img = new Image();
  img.src = src;
  await img.decode();
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  c.getContext('2d').drawImage(img, 0, 0);
  return c.toDataURL('image/webp', 0.86).split(',')[1];
}, 'data:image/png;base64,' + png.toString('base64'));
const webp = resolve(sortie + '.webp');
writeFileSync(webp, Buffer.from(webpBase64, 'base64'));

await browser.close();
console.log('Écrits :', jpg, webp);
