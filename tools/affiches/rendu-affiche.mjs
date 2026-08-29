// Rend une affiche HTML A3 portrait (1754×2480) en PNG 300 dpi et en PDF A3.
// Usage : node rendu-affiche.mjs <fichier.html> <sortie.png> [sortie.pdf]
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [, , htmlPath, pngPath, pdfPath] = process.argv;
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const page = await browser.newPage({
  viewport: { width: 1754, height: 2480 },
  deviceScaleFactor: 2, // → 3508×4960 px, soit un A3 à 300 dpi (A4 à 420 dpi)
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
    width: '297mm',
    height: '420mm',
    printBackground: true,
    scale: 1122.5 / 1754,
    pageRanges: '1',
  });
  console.log('PDF écrit :', resolve(pdfPath));
}
await browser.close();
