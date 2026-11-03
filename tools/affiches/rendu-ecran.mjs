// Rend un visuel HTML pour écran (vitrine, TV) en PNG, en définition simple
// et double (ex. Full HD + 4K pour une page de 1920×1080).
// Usage : node rendu-ecran.mjs <fichier.html> <sortie-sans-extension> <largeur> <hauteur>
//   ex. : node rendu-ecran.mjs journees-privilege-2026-ecran-vitrine-16x9.html journees-privilege-2026-ecran-vitrine-16x9 1920 1080
// Produit <sortie>-<l>x<h>.png et <sortie>-<2l>x<2h>.png.
// (import absolu : NODE_PATH n'est pas lu par les modules ES)
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const [, , htmlPath, sortie, largeur, hauteur] = process.argv;
if (!htmlPath || !sortie || !largeur || !hauteur) {
  console.error('Usage : node rendu-ecran.mjs <fichier.html> <sortie-sans-extension> <largeur> <hauteur>');
  process.exit(1);
}
const browser = await chromium.launch();
for (const echelle of [1, 2]) {
  const page = await browser.newPage({
    viewport: { width: +largeur, height: +hauteur },
    deviceScaleFactor: echelle,
  });
  await page.goto(pathToFileURL(resolve(htmlPath)).href);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(250);
  const png = resolve(`${sortie}-${largeur * echelle}x${hauteur * echelle}.png`);
  await page.screenshot({ path: png });
  console.log('PNG écrit :', png);
  await page.close();
}
await browser.close();
