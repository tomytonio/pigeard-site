// Rend une affiche HTML A4 en PNG 300 dpi et en PDF A4.
// Usage : node rendu-a4.mjs <fichier.html> <sortie.png> [sortie.pdf] [paysage|portrait]
//   paysage  : page HTML de 1754×1240 px → PNG 3508×2480 (A4 paysage, 300 dpi)
//   portrait : page HTML de 1240×1754 px → PNG 2480×3508 (A4 portrait, 300 dpi)
// Orientation par défaut : portrait. Le PDF est vectoriel pour le texte et les
// formes (les photos restent à leur définition d'origine).
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [, , htmlPath, pngPath, pdfPath, orientation = 'portrait'] = process.argv;
if (!htmlPath || !pngPath || !['paysage', 'portrait'].includes(orientation)) {
  console.error('Usage : node rendu-a4.mjs <fichier.html> <sortie.png> [sortie.pdf] [paysage|portrait]');
  process.exit(1);
}
const paysage = orientation === 'paysage';
const largeur = paysage ? 1754 : 1240;
const hauteur = paysage ? 1240 : 1754;

const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: largeur, height: hauteur },
  deviceScaleFactor: 2, // 1754 px × 2 = 3508 px sur 297 mm = 300 dpi
});
await page.goto(pathToFileURL(resolve(htmlPath)).href);
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(250);
await page.screenshot({ path: resolve(pngPath) });
console.log('PNG écrit :', resolve(pngPath));
if (pdfPath) {
  // 297 mm = 1122,5 px CSS à 96 dpi → échelle pour faire tenir les 1754 px.
  await page.pdf({
    path: resolve(pdfPath),
    width: paysage ? '297mm' : '210mm',
    height: paysage ? '210mm' : '297mm',
    printBackground: true,
    scale: 1122.5 / 1754,
    pageRanges: '1',
  });
  console.log('PDF écrit :', resolve(pdfPath));
}
await browser.close();
